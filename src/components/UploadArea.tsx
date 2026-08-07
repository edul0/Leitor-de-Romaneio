import React, { useState } from 'react';
import { Upload, ImagePlus } from 'lucide-react';

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelected }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) {
        onFilesSelected(files);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
    }
  };

  return (
    <div className="w-full flex justify-center px-4">
      <div 
        className={`w-full max-w-4xl min-h-[400px] rounded-xl flex flex-col items-center justify-center p-12 transition-all duration-300 clean-card border-2 border-dashed ${
          isDragOver 
            ? 'border-rose-500 bg-rose-50/50 scale-[1.01]' 
            : 'border-slate-300 hover:border-slate-400 bg-white'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className={`p-6 rounded-full mb-6 transition-all duration-300 ${isDragOver ? 'bg-rose-100 scale-110' : 'bg-slate-50'}`}>
          <ImagePlus className={`w-16 h-16 ${isDragOver ? 'text-rose-500' : 'text-slate-400'}`} />
        </div>
        
        <h2 className="text-3xl font-display font-bold text-slate-800 mb-4 text-center tracking-tight">
          Selecione as imagens dos Romaneios
        </h2>
        
        <p className="text-slate-500 text-center mb-10 max-w-lg text-lg">
          Arraste e solte seus arquivos JPG, PNG ou WEBP aqui ou clique no botão abaixo.
        </p>

        <label className="cursor-pointer px-10 py-5 rounded-xl text-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all btn-hero flex items-center gap-3">
          <Upload className="w-6 h-6" />
          Selecionar Arquivos
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
        </label>
        
        <p className="mt-8 text-sm text-slate-400">
          Você pode enviar vários arquivos de uma só vez.
        </p>
      </div>
    </div>
  );
};
