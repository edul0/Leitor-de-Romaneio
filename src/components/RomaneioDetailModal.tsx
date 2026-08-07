import React, { useState } from 'react';
import { X, Plus, Trash2, Check, ZoomIn, ZoomOut, Hash, Calendar, Layers } from 'lucide-react';
import type { RomaneioRecord, RomaneioItem } from '../types/romaneio';

interface RomaneioDetailModalProps {
  record: RomaneioRecord | null;
  onClose: () => void;
  onUpdateRecord: (updated: RomaneioRecord) => void;
}

export const RomaneioDetailModal: React.FC<RomaneioDetailModalProps> = ({
  record,
  onClose,
  onUpdateRecord,
}) => {
  if (!record) return null;

  const [romaneioNumero, setRomaneioNumero] = useState(record.romaneioNumero);
  const [data, setData] = useState(record.data);
  const [pagamento, setPagamento] = useState(record.pagamento || '');
  const [itens, setItens] = useState<RomaneioItem[]>(record.itens);
  const [zoom, setZoom] = useState(1);

  const handleItemChange = (
    index: number,
    field: keyof RomaneioItem,
    value: string | number
  ) => {
    const newItens = [...itens];
    const item = { ...newItens[index] };

    if (field === 'quantidade' || field === 'valorUnitario' || field === 'valorTotal') {
      const numVal = value === '' ? '' : Number(value);
      (item as any)[field] = numVal;

      // Auto recalculate total if qtd or unit price changes
      if (field === 'quantidade' || field === 'valorUnitario') {
        const q = typeof item.quantidade === 'number' ? item.quantidade : 0;
        const u = typeof item.valorUnitario === 'number' ? item.valorUnitario : 0;
        item.valorTotal = q * u;
      }
    } else {
      (item as any)[field] = value;
    }

    newItens[index] = item;
    setItens(newItens);
  };

  const handleAddItem = () => {
    setItens([
      ...itens,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        quantidade: 0,
        embalagem: 'scs',
        mercadoria: '',
        valorUnitario: 0,
        valorTotal: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onUpdateRecord({
      ...record,
      romaneioNumero,
      data,
      pagamento,
      itens,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-6xl h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-600 border border-rose-200 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" /> Nº {romaneioNumero || 'Sem Nº'}
            </span>
            <h3 className="text-base font-bold text-slate-800">
              Conferência Individual: <span className="text-slate-500 font-normal">{record.filename}</span>
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" /> Salvar Alterações
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Side-by-Side */}
        <div className="flex-1 grid grid-cols-2 overflow-hidden bg-slate-50/50">
          {/* Left Panel: Image Zoom */}
          <div className="relative bg-slate-100 border-r border-slate-200 flex flex-col p-0 overflow-hidden group">
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
              <button
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                title="Reduzir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-600 w-12 text-center font-bold">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
              <div 
                className="min-h-full flex items-start justify-center transition-all duration-200"
                style={{ width: zoom === 1 ? '100%' : `${zoom * 100}%` }}
              >
                <img
                  src={record.imageUrl}
                  alt="Romaneio Original"
                  className="rounded-xl shadow-md border border-slate-200"
                  style={{ 
                    maxHeight: zoom === 1 ? '100%' : 'none',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Editable Form */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Header Fields */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Nº do Romaneio
                </label>
                <input
                  type="text"
                  value={romaneioNumero}
                  onChange={(e) => setRomaneioNumero(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono font-bold text-base focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-shadow"
                  placeholder="004064"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Data Manuscrita
                </label>
                <input
                  type="text"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-shadow"
                  placeholder="16.07.26"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Pagamento
                </label>
                <input
                  type="text"
                  value={pagamento}
                  onChange={(e) => setPagamento(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono font-bold text-base focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-shadow"
                  placeholder="Ex: Dinheiro"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-500" />
                  Itens e Mercadorias Lidos
                </h4>
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Linha
                </button>
              </div>

              <div className="space-y-2">
                {itens.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="grid grid-cols-12 gap-2 p-3 rounded-xl bg-white border border-slate-200 shadow-sm items-center hover:border-slate-300 transition-colors"
                  >
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Qtd</label>
                      <input
                        type="number"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(idx, 'quantidade', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono focus:bg-white focus:outline-none focus:border-rose-400"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Emb.</label>
                      <input
                        type="text"
                        value={item.embalagem}
                        onChange={(e) => handleItemChange(idx, 'embalagem', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-rose-400"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Nome da Mercadoria</label>
                      <input
                        type="text"
                        value={item.mercadoria}
                        onChange={(e) => handleItemChange(idx, 'mercadoria', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:bg-white focus:outline-none focus:border-rose-400"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Valor Unit. (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.valorUnitario}
                        onChange={(e) => handleItemChange(idx, 'valorUnitario', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono focus:bg-white focus:outline-none focus:border-rose-400"
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Valor Total (R$)</label>
                        <div className="px-2 py-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-bold truncate">
                          {((typeof item.valorTotal === 'number' ? item.valorTotal : 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="mt-4 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
