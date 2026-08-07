import React from 'react';
import { RefreshCw, Layers, DollarSign, Package } from 'lucide-react';
import type { RomaneioRecord } from '../types/romaneio';
import logo from '../assets/logo.png';

interface HeaderProps {
  records: RomaneioRecord[];
  onClearAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  records,
  onClearAll,
}) => {
  const successRecords = records.filter((r) => r.status === 'success');
  
  const totalItens = successRecords.reduce((acc, r) => acc + r.itens.length, 0);

  const totalValorGeral = successRecords.reduce((acc, r) => {
    return (
      acc +
      r.itens.reduce((sum, item) => {
        const qtd = typeof item.quantidade === 'number' ? item.quantidade : 0;
        const valUnit = typeof item.valorUnitario === 'number' ? item.valorUnitario : 0;
        const valTot = typeof item.valorTotal === 'number' ? item.valorTotal : qtd * valUnit;
        return sum + valTot;
      }, 0)
    );
  }, 0);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm px-4">
      <div className="max-w-7xl mx-auto py-3 flex items-center justify-between">
        
        {/* Branding */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="Romaneio Reader Logo" className="w-11 h-11 rounded-lg object-cover shadow-sm border border-slate-200" />
          <div>
            <h1 className="text-xl font-display font-bold text-slate-800 tracking-tight">Romaneio Reader</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Extração Inteligente</p>
              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-bold">v1.1.1</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {records.length > 0 && (
          <div className="hidden md:flex items-center gap-6 bg-slate-50 border border-slate-200 px-5 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lotes</div>
                <div className="text-sm font-bold text-slate-700 leading-none">{records.length}</div>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Itens</div>
                <div className="text-sm font-bold text-slate-700 leading-none">{totalItens}</div>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</div>
                <div className="text-sm font-bold text-slate-800 leading-none">
                  {totalValorGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {records.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
              title="Limpar lote atual"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Limpar Lote
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
