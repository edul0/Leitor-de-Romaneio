import React from 'react';
import { FileSpreadsheet, Eye, Trash2, CheckCircle2, AlertCircle, Loader2, ListOrdered, Calendar } from 'lucide-react';
import type { RomaneioRecord } from '../types/romaneio';
import { exportToExcel } from '../utils/excelExporter';

interface DataTableProps {
  records: RomaneioRecord[];
  onSelectRecord: (record: RomaneioRecord) => void;
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (updated: RomaneioRecord) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onUpdateRecord,
}) => {
  const successCount = records.filter((r) => r.status === 'success').length;

  const handleExport = () => {
    exportToExcel(records, `romaneios_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl clean-card">
        <div>
          <h2 className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
            Lote de Romaneios Processados ({records.length})
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {successCount} de {records.length} prontos para exportar
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={successCount === 0}
          className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Baixar Planilha Excel
        </button>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl clean-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-4 px-5 w-14 text-center">Foto</th>
                <th className="py-4 px-5">Nº Romaneio</th>
                <th className="py-4 px-5">Data</th>
                <th className="py-4 px-5">Mercadorias / Itens</th>
                <th className="py-4 px-5 text-right">Qtd</th>
                <th className="py-4 px-5 text-right">Valor Total</th>
                <th className="py-4 px-5 text-center">Pagamento</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5 text-center w-28">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => {
                const totalQtd = record.itens.reduce(
                  (sum, item) => sum + (typeof item.quantidade === 'number' ? item.quantidade : 0),
                  0
                );

                const totalValor = record.itens.reduce((sum, item) => {
                  const q = typeof item.quantidade === 'number' ? item.quantidade : 0;
                  const u = typeof item.valorUnitario === 'number' ? item.valorUnitario : 0;
                  const t = typeof item.valorTotal === 'number' ? item.valorTotal : q * u;
                  return sum + t;
                }, 0);

                return (
                  <React.Fragment key={record.id}>
                    <tr className="hover:bg-slate-50 transition-colors group">
                      {/* Thumbnail */}
                      <td className="py-3 px-5 text-center">
                        <div
                          onClick={() => onSelectRecord(record)}
                          className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden border border-slate-200 cursor-pointer hover:border-rose-400 transition-all flex items-center justify-center relative group/img mx-auto"
                        >
                          <img
                            src={record.imageUrl}
                            alt="Romaneio"
                            className="w-full h-full object-cover opacity-90 group-hover/img:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-rose-600/10 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-5 h-5 text-rose-600 drop-shadow-md" />
                          </div>
                        </div>
                      </td>

                      {/* Romaneio Nº */}
                      <td className="py-3 px-5">
                        {record.status === 'processing' ? (
                          <div className="h-6 w-20 bg-slate-200 animate-pulse rounded-md" />
                        ) : (
                          <div className="flex items-center gap-2 group-focus-within:bg-rose-50 rounded-md p-1.5 transition-colors -ml-1.5">
                            <ListOrdered className="w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              value={record.romaneioNumero}
                              onChange={(e) =>
                                onUpdateRecord({ ...record, romaneioNumero: e.target.value })
                              }
                              className="bg-transparent border-none focus:outline-none w-24 font-mono font-bold text-slate-800 placeholder-slate-400"
                              placeholder="Vazio"
                            />
                          </div>
                        )}
                      </td>

                      {/* Data */}
                      <td className="py-3 px-5">
                        {record.status === 'processing' ? (
                          <div className="h-6 w-24 bg-slate-200 animate-pulse rounded-md" />
                        ) : (
                          <div className="flex items-center gap-2 group-focus-within:bg-slate-100 rounded-md p-1.5 transition-colors -ml-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              value={record.data}
                              onChange={(e) =>
                                onUpdateRecord({ ...record, data: e.target.value })
                              }
                              className="bg-transparent border-none focus:outline-none w-28 font-mono text-slate-700 placeholder-slate-400"
                              placeholder="Vazio"
                            />
                          </div>
                        )}
                      </td>

                      {/* Mercadorias preview */}
                      <td className="py-3 px-5">
                        {record.status === 'processing' ? (
                          <div className="space-y-2">
                            <div className="h-3 w-32 bg-slate-200 animate-pulse rounded-full" />
                            <div className="h-3 w-24 bg-slate-200 animate-pulse rounded-full" />
                          </div>
                        ) : record.status === 'error' ? (
                          <div className="text-rose-600 font-semibold text-xs flex items-center gap-1.5 bg-rose-50 p-2 rounded-md w-fit border border-rose-100">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {record.errorMessage || 'Falha ao processar'}
                          </div>
                        ) : (
                          <div className="space-y-1.5 py-1">
                            {record.itens.length === 0 && (
                              <span className="text-slate-400 italic text-xs">Nenhuma mercadoria</span>
                            )}
                            {record.itens.slice(0, 3).map((item, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={item.mercadoria}>
                                  {item.mercadoria || 'Sem nome'}
                                </span>
                                <span className="text-slate-500 font-mono">
                                  ({item.quantidade}x R${Number(item.valorUnitario).toFixed(2)})
                                </span>
                              </div>
                            ))}
                            {record.itens.length > 3 && (
                              <div className="text-[10px] font-bold text-rose-500">
                                + {record.itens.length - 3} itens ocultos...
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Qtd Total */}
                      <td className="py-3 px-5 text-right font-mono font-medium text-slate-600">
                        {record.status === 'processing' ? (
                          <div className="h-5 w-12 bg-slate-200 animate-pulse rounded ml-auto" />
                        ) : (
                          totalQtd > 0 ? totalQtd : '-'
                        )}
                      </td>

                      {/* Valor Total */}
                      <td className="py-3 px-5 text-right font-mono font-bold text-slate-800">
                        {record.status === 'processing' ? (
                          <div className="h-5 w-20 bg-slate-200 animate-pulse rounded ml-auto" />
                        ) : (
                          totalValor > 0 ? totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
                        )}
                      </td>

                      {/* Pagamento */}
                      <td className="py-3 px-5 text-center">
                        {record.status === 'processing' ? (
                          <div className="h-6 w-20 bg-slate-200 animate-pulse rounded-md mx-auto" />
                        ) : (
                          <input
                            type="text"
                            value={record.pagamento || ''}
                            onChange={(e) =>
                              onUpdateRecord({ ...record, pagamento: e.target.value })
                            }
                            className="bg-transparent border-b border-slate-200 focus:border-rose-400 focus:outline-none w-24 text-center font-semibold text-slate-700 placeholder-slate-400"
                            placeholder="Tipo"
                          />
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-5 text-center">
                        {record.status === 'processing' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Lendo
                          </span>
                        )}
                        {record.status === 'success' && record.statusDocumento !== 'CANCELADO' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pronto
                          </span>
                        )}
                        {record.status === 'success' && record.statusDocumento === 'CANCELADO' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200" title="Documento marcado como cancelado">
                            <AlertCircle className="w-3.5 h-3.5" /> Cancelado
                          </span>
                        )}
                        {record.status === 'error' && (
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 cursor-help"
                            title={record.errorMessage}
                          >
                            <AlertCircle className="w-3.5 h-3.5" /> Erro
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onSelectRecord(record)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Ver e editar detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(record.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
