export interface RomaneioItem {
  id: string;
  quantidade: number | '';
  embalagem: string;
  mercadoria: string;
  valorUnitario: number | '';
  valorTotal: number | '';
}

export interface RomaneioRecord {
  id: string;
  filename: string;
  imageUrl: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  statusDocumento?: 'NORMAL' | 'CANCELADO';
  errorMessage?: string;
  romaneioNumero: string;
  data: string;
  pagamento?: string;
  itens: RomaneioItem[];
  totalVolumes?: string;
  confidenceScore?: number;
}
