import React, { useState } from 'react';
import { Key, Check, ShieldCheck, X, Sparkles, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  const [tempKey, setTempKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(tempKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Chave Gratuita da API Gemini</h3>
            <p className="text-xs text-slate-400">Para leitura de visão computacional em fotos reais</p>
          </div>
        </div>

        {/* Instructions to get free key */}
        <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between font-bold text-white">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Como obter uma chave 100% gratuita:
            </span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
            <li>Acesse o <strong>Google AI Studio</strong> com sua conta do Google/Gmail.</li>
            <li>Clique no botão <strong>"Create API key"</strong>.</li>
            <li>Copie a chave gerada e cole no campo abaixo.</li>
          </ol>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 transition-all text-center"
          >
            Obter Chave Gratuita no Google AI Studio <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-3 mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cole sua Chave da API Gemini Aqui:
          </label>
          <input
            type="password"
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-mono"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" /> Salvo!
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Salvar e Usar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
