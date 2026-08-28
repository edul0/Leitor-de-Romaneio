import type { RomaneioRecord, RomaneioItem } from '../types/romaneio';

function parseDataUrl(dataUrl: string): { mimeType: string; base64Data: string } {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], base64Data: matches[2] };
  }
  return { mimeType: 'image/jpeg', base64Data: dataUrl.replace(/^data:image\/\w+;base64,/, '') };
}

let cachedWorkingModel: string | null = null; // Removed hardcoded 'gemini-1.5-flash' to let it discover

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`[Timeout] A requisição excedeu o tempo limite de ${timeoutMs / 1000}s`);
    }
    throw error;
  }
}

let discoveredModels: string[] | null = null;
let discoverPromise: Promise<string[]> | null = null;

async function discoverBestModels(apiKey: string): Promise<string[]> {
  if (apiKey.startsWith('sk-or-')) {
    return ['openrouter/free'];
  }
  if (discoveredModels) return discoveredModels;
  if (discoverPromise) return discoverPromise;

  discoverPromise = (async () => {
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {},
        30000 // 30 seconds for discovering models
      );
      if (!res.ok) throw new Error('Falha ao listar modelos');
      const data = await res.json();
      const models = data.models || [];
      const visionModels = models
        .filter((m: any) => 
          m.supportedGenerationMethods?.includes('generateContent') &&
          m.name.includes('gemini')
        )
        .map((m: any) => m.name.replace('models/', ''));

      // Sort prioritizing higher version numbers, lite, and flash
      const sorted = visionModels.sort((a: string, b: string) => {
        const matchA = a.match(/gemini-(\d+\.\d+)/);
        const matchB = b.match(/gemini-(\d+\.\d+)/);
        const verA = matchA ? parseFloat(matchA[1]) : 0;
        const verB = matchB ? parseFloat(matchB[1]) : 0;

        if (verA !== verB) {
          return verB - verA; // Descending order (3.6 > 3.5 > 2.5)
        }

        const aLite = a.includes('lite') ? 1 : 0;
        const bLite = b.includes('lite') ? 1 : 0;
        if (aLite !== bLite) return bLite - aLite; // Prioritize lite

        const aFlash = a.includes('flash') ? 1 : 0;
        const bFlash = b.includes('flash') ? 1 : 0;
        return bFlash - aFlash;
      });
      
      if (sorted.length > 0) {
        discoveredModels = sorted;
        return sorted;
      }
      return ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];
    } catch (e) {
      return ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];
    }
  })();
  
  return discoverPromise;
}

export async function processRomaneioImage(
  imageSrc: string,
  filename: string,
  apiKey?: string
): Promise<Partial<RomaneioRecord>> {
  const isSampleDemo = filename === 'romaneio_004064.jpg';
  if (isSampleDemo) {
    return {
      romaneioNumero: '004064',
      data: '16.07.26',
      itens: [
        { id: 'demo-1', quantidade: 600, embalagem: 'scs', mercadoria: 'BATATA ESPECIAL LAVADA', valorUnitario: 35.0, valorTotal: 21000.0 },
        { id: 'demo-2', quantidade: 60,  embalagem: 'scs', mercadoria: 'BATATA ESPECIAL LAVADA 1ª', valorUnitario: 5.0, valorTotal: 300.0 },
      ],
      confidenceScore: 98,
    };
  }

  if (!apiKey || apiKey.trim().length < 10) {
    throw new Error('Configure a Chave de API Gemini (gratuita) para ler romaneios reais. Clique em "Configurar API Key".');
  }

  const cleanKey = apiKey.trim();
  const { mimeType, base64Data } = parseDataUrl(imageSrc);

  const promptText = `Você é um especialista em leitura de romaneios manuscritos do Brasil.
Sua missão é extrair os dados com 100% de precisão matemática e visual. Caligrafias podem ser confusas, então você DEVE raciocinar passo a passo antes de dar a resposta final.

Regras Críticas:
1. NÚMEROS MASCARADOS: O número "1" frequentemente é escrito como um traço diagonal longo OU com um laço curvo no topo, parecendo um "2" ou "9". O número 5 e 2 podem se parecer. Cuidado com o ponto de milhar (ex: "1.100" não é "908"). Leia cada dígito com extrema atenção!
2. NUNCA INVENTE: Transcreva EXATAMENTE os números que vê.
3. PROVA MATEMÁTICA: Multiplique "Quantidade" por "Valor Unitário". O resultado DEVE SER IGUAL ao "Valor Total". Se a conta não bater, você leu errado, volte e corrija! ATENÇÃO: Se a coluna TOTAL estiver em branco, a prova matemática será impossível; nesse caso redobre sua atenção visual na Quantidade.
4. DOCUMENTO CANCELADO: Se houver "CANCELADO" escrito, defina "status_documento": "CANCELADO" e preencha "itens" como lista vazia.

Responda SOMENTE com um JSON válido, sem nenhum texto Markdown fora dele.
Formato do JSON exigido:
{
  "status_documento": "NORMAL ou CANCELADO",
  "romaneio_numero": "número do romaneio (pode ser o número em vermelho, ou o número impresso no topo após 'Nº' ex: Nº 482)",
  "data": "data formatada OBRIGATORIAMENTE no padrão DD/MM/YY (ex: 16/07/26)",
  "pagamento": "forma de pagamento se estiver escrita (ex: Dinheiro, Pix, Cheque, Prazo). Se não houver, deixe vazio",
  "itens": [
    {
      "raciocinio": "String onde você pensa em voz alta. Ex: 'Vejo na linha 1 a quant 1200. Valor unit é 25. Total é 30000. 1200 * 25 = 30000. A conta bate. A mercadoria lida letra por letra é BATATA ESPECIAL LAVADA. Não tem peso no fim.'",
      "quantidade": 1200,
      "mercadoria": "BATATA ESPECIAL LAVADA",
      "valor_unitario": 25.0,
      "valor_total": 30000.0
    }
  ]
}`;

  const modelNames = await discoverBestModels(cleanKey);
  let lastError: Error | null = null;

  for (const modelName of modelNames) {
    let retries = 0;
    let rateLimitRetries = 0;
    const maxRetries = 2; 
    const maxRateLimitRetries = 5; 

    while (retries <= maxRetries && rateLimitRetries <= maxRateLimitRetries) {
      try {
        const attempt = retries + rateLimitRetries + 1;
        console.log(`Tentando modelo: ${modelName} (Tentativa ${attempt})`);

        const isOpenRouter = cleanKey.startsWith('sk-or-');
        let fetchUrl = '';
        let fetchOptions: RequestInit = {};

        if (isOpenRouter) {
          fetchUrl = 'https://openrouter.ai/api/v1/chat/completions';
          fetchOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${cleanKey}`,
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: promptText },
                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                  ]
                }
              ],
              temperature: 0.0
            })
          };
        } else {
          fetchUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;
          fetchOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: promptText },
                  { inlineData: { mimeType, data: base64Data } },
                ],
              }],
              generationConfig: { temperature: 0.0, responseMimeType: 'application/json' },
            }),
          };
        }

        const response = await fetchWithTimeout(fetchUrl, fetchOptions, 300000);

        if (!response.ok) {
          if (response.status === 429) {
            const delay = (rateLimitRetries + 1) * 10000;
            console.warn(`[429] Limite da API excedido. Pausando trabalhador por ${delay / 1000}s...`);
            await new Promise(r => setTimeout(r, delay));
            rateLimitRetries++;
            if (rateLimitRetries > maxRateLimitRetries) {
               throw new Error('Muitos arquivos enviados ao mesmo tempo (Limite da API Gratuita). Tente enviar em lotes menores (ex: 15 arquivos por vez).');
            }
            continue; 
          }

          const err = await response.json().catch(() => ({}));
          const apiMsg = err?.error?.message || err?.message || `Erro HTTP ${response.status}`;
          
          if (apiMsg.includes('API_KEY_INVALID') || apiMsg.includes('API key not valid')) {
            throw new Error('Chave de API inválida. Verifique sua chave no Google AI Studio.');
          }
          
          if (apiMsg.includes('no longer available') || apiMsg.includes('not found') || apiMsg.includes('retired')) {
            console.warn(`[Pulo] Modelo ${modelName} indisponível: ${apiMsg}`);
            lastError = new Error(`[API Google] ${apiMsg}`);
            break; 
          }
          
          throw new Error(`[API Google] ${apiMsg}`);
        }

        const result = await response.json();
        let raw = '';
        if (isOpenRouter) {
          raw = result.choices?.[0]?.message?.content;
        } else {
          raw = result.candidates?.[0]?.content?.parts?.[0]?.text;
        }
        if (!raw) throw new Error('A API retornou uma resposta vazia.');

        const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        const items: RomaneioItem[] = (parsed.itens || [])
          .filter((item: any) => item.quantidade > 0 || item.mercadoria)
          .map((item: any, idx: number) => {
            const qtd   = Number(item.quantidade) || 0;
            const vUnit = Number(item.valor_unitario) || 0;
            const vTot  = Number(item.valor_total) || qtd * vUnit;
            return {
              id: `item-${Date.now()}-${idx}`,
              quantidade: qtd,
              embalagem: 'scs',
              mercadoria: String(item.mercadoria || '').toUpperCase(),
              valorUnitario: vUnit,
              valorTotal: vTot,
            };
          });

        cachedWorkingModel = modelName;

        return {
          statusDocumento: parsed.status_documento === 'CANCELADO' ? 'CANCELADO' : 'NORMAL',
          romaneioNumero: String(parsed.romaneio_numero || '').replace(/\D/g, ''),
          data: String(parsed.data || ''),
          pagamento: String(parsed.pagamento || ''),
          itens: items,
          confidenceScore: 97,
        };

      } catch (err: any) {
        if (
          err.message.includes('Chave de API inválida') || 
          err.message.includes('Muitos arquivos enviados') || 
          err.message.includes('[Timeout]') ||
          err.message.includes('Failed to fetch')
        ) {
          throw err; 
        }
        
        console.warn(`Erro no modelo ${modelName}:`, err.message);
        lastError = err;
        
        if (cachedWorkingModel === modelName) {
           cachedWorkingModel = null;
        }
        break; 
      }
    }
  }

  throw lastError || new Error('Nenhum modelo compatível conseguiu processar a imagem.');
}

