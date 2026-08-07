import { useState } from 'react';
import { Header } from './components/Header';
import { UploadArea } from './components/UploadArea';
import { DataTable } from './components/DataTable';
import { RomaneioDetailModal } from './components/RomaneioDetailModal';
import { UpdaterUI } from './components/UpdaterUI';
import type { RomaneioRecord } from './types/romaneio';
import { processRomaneioImage } from './services/geminiOcrService';
import { Upload } from 'lucide-react';

export function App() {
  const [records, setRecords] = useState<RomaneioRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RomaneioRecord | null>(null);
  
  // Array de chaves (revezamento)
  const envKeys = import.meta.env.VITE_API_KEYS || '';
  const apiKeys = envKeys.split(/[\n,]+/).map((k: string) => k.trim()).filter(Boolean);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (files: File[]) => {
    const newRecords: RomaneioRecord[] = files.map((file, idx) => ({
      id: `romaneio-${Date.now()}-${idx}-${Math.random()}`,
      filename: file.name,
      imageUrl: URL.createObjectURL(file),
      status: 'pending' as const,
      romaneioNumero: '',
      data: '',
      itens: [],
    }));

    setRecords((prev) => [...newRecords, ...prev]);

    // A API gratuita do Google permite 15 requisições por minuto (RPM) por Projeto.
    // Se as chaves vierem do mesmo projeto, elas dividem o limite.
    // Como temos múltiplas chaves configuradas (revezamento), podemos processar vários em paralelo.
    const CONCURRENCY_LIMIT = apiKeys.length; // Máximo desempenho usando todas as chaves
    
    // Fila de processamento e contador de tentativas
    const queue = Array.from({ length: files.length }, (_, k) => k);
    const retryCounts: Record<number, number> = {};
    let keyIndex = 0;

    const processNext = async (): Promise<void> => {
      while (queue.length > 0) {
        const currentIndex = queue.shift();
        if (currentIndex === undefined) break;

        const file = files[currentIndex];
        const targetId = newRecords[currentIndex].id;

        // Revezamento (Round-Robin) dinâmico
        const currentKey = apiKeys[keyIndex % apiKeys.length];
        keyIndex++;

        // Atualiza UI para 'processing'
        setRecords((prev) =>
          prev.map((r) => r.id === targetId && r.status !== 'processing' ? { ...r, status: 'processing' as const } : r)
        );

        try {
          const dataUrl = await fileToDataUrl(file);
          
          // FILA INTELIGENTE: Trava global (1 requisição a cada 4.2 segundos) para garantir que NUNCA passamos de 14 RPM
          // Trava global pequena (800ms) só para não estourar o limite de conexões simultâneas do navegador
          while (Date.now() - window.__globalLastDispatched < 800) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          window.__globalLastDispatched = Date.now();
          
          const extracted = await processRomaneioImage(dataUrl, file.name, currentKey);

          setRecords((prev) =>
            prev.map((r) =>
              r.id === targetId
                ? { ...r, status: 'success' as const, ...extracted }
                : r
            )
          );

        } catch (err: any) {
          const retries = retryCounts[currentIndex] || 0;
          
          if (err.message.includes('Chave de API inválida') || err.message.includes('Muitos arquivos enviados ao mesmo tempo')) {
            setRecords((prev) =>
              prev.map((r) =>
                r.id === targetId
                  ? { ...r, status: 'error' as const, errorMessage: err.message }
                  : r
              )
            );
            continue; 
          }

          if (retries < 3) {
            retryCounts[currentIndex] = retries + 1;
            queue.push(currentIndex); // Coloca no final da fila
          } else {
            setRecords((prev) =>
              prev.map((r) =>
                r.id === targetId
                  ? { ...r, status: 'error' as const, errorMessage: err.message || 'Erro persistente após 3 tentativas' }
                  : r
              )
            );
          }
        }
      }
    };

    // Inicializa a variável global se não existir
    if (typeof window.__globalLastDispatched === 'undefined') {
       window.__globalLastDispatched = 0;
    }

    // Start initial workers
    const workers = [];
    for (let w = 0; w < Math.min(CONCURRENCY_LIMIT, files.length); w++) {
      workers.push(processNext());
    }

    await Promise.all(workers);
  };

  const handleUpdateRecord = (updated: RomaneioRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <>
      <UpdaterUI />
      <div className="flex flex-col font-sans relative z-10 animate-fadeIn min-h-screen text-slate-800">
        <Header
          records={records}
          onClearAll={() => setRecords([])}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          
          {records.length === 0 ? (
            <div className="pt-10">
              <UploadArea onFilesSelected={handleFilesSelected} />
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl clean-card">
                <div className="text-sm text-slate-600 font-medium">
                  Precisa ler mais romaneios? Adicione ao lote atual:
                </div>
                <label className="cursor-pointer px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Adicionar Arquivos
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.length) handleFilesSelected(Array.from(e.target.files));
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <DataTable
                records={records}
                onSelectRecord={setSelectedRecord}
                onDeleteRecord={handleDeleteRecord}
                onUpdateRecord={handleUpdateRecord}
              />
            </div>
          )}
        </main>
      </div>

      <RomaneioDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onUpdateRecord={handleUpdateRecord}
      />
    </>
  );
}

export default App;
