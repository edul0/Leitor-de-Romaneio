import React, { useEffect, useState } from 'react';
import { DownloadCloud, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const UpdaterUI: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'available' | 'downloading' | 'downloaded' | 'error'>('idle');
  const [version, setVersion] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    // We check if we are in Electron
    const electron = (window as any).require ? (window as any).require('electron') : null;
    if (!electron) return;

    const { ipcRenderer } = electron;

    const handleUpdaterEvent = (_event: any, payload: any) => {
      switch (payload.type) {
        case 'available':
          setStatus('available');
          setVersion(payload.version);
          break;
        case 'progress':
          setStatus('downloading');
          setProgress(payload.percent || 0);
          break;
        case 'downloaded':
          setStatus('downloaded');
          break;
        case 'error':
          setStatus('error');
          setErrorMsg(payload.error || 'Erro desconhecido');
          break;
      }
    };

    ipcRenderer.on('updater-event', handleUpdaterEvent);

    return () => {
      ipcRenderer.removeListener('updater-event', handleUpdaterEvent);
    };
  }, []);

  const handleInstall = () => {
    const electron = (window as any).require ? (window as any).require('electron') : null;
    if (electron) {
      electron.ipcRenderer.send('updater-install');
    }
  };

  if (status === 'idle') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-80 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <DownloadCloud className="w-5 h-5 text-rose-500" />
          <h3 className="font-bold text-slate-800 text-sm">Atualização do Sistema</h3>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3">
          
          {status === 'available' && (
            <div>
              <p className="text-xs text-slate-600 font-medium">
                Oba! A versão <span className="font-bold text-rose-600">v{version}</span> está disponível.
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Preparando para baixar...
              </p>
            </div>
          )}

          {status === 'downloading' && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium animate-pulse">Baixando arquivos...</span>
                <span className="font-mono font-bold text-slate-800">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === 'downloaded' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Tudo pronto! A nova versão já foi baixada e está pronta para ser instalada.
                </p>
              </div>
              <button
                onClick={handleInstall}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Instalar e Reiniciar
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-rose-700">Erro na atualização</span>
                <span className="text-[10px] text-rose-600/80 line-clamp-2">{errorMsg}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
