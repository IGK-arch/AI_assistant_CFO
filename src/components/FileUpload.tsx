import React, { useCallback, useState } from 'react';
import { Upload, File, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from './ui';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  maxSize?: number; // в байтах
  className?: string;
}

interface FileStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = '.csv',
  multiple = false,
  onFilesSelected,
  maxSize = 10 * 1024 * 1024, // 10MB по умолчанию
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<FileStatus[]>([]);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `Файл слишком большой. Максимальный размер: ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    
    if (accept && !accept.split(',').some(type => 
      file.name.toLowerCase().endsWith(type.trim().replace('*', ''))
    )) {
      return `Неподдерживаемый тип файла. Разрешены: ${accept}`;
    }
    
    return null;
  };

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles = Array.from(fileList);
    const fileStatuses: FileStatus[] = newFiles.map(file => {
      const error = validateFile(file);
      return {
        file,
        status: error ? 'error' : 'success',
        error: error || undefined
      };
    });

    setFiles(prev => [...prev, ...fileStatuses]);
    
    // Передаем только валидные файлы
    const validFiles = fileStatuses
      .filter(fs => fs.status === 'success')
      .map(fs => fs.file);
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected, maxSize, accept]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const { files } = e.dataTransfer;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Сбрасываем значение input для возможности повторного выбора того же файла
    e.target.value = '';
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
  };

  return (
    <div className={className}>
      {/* Drag & Drop область */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver 
            ? 'border-primary-400 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-900">
            Перетащите файлы сюда или
          </p>
          <label className="mt-2 inline-block">
            <span className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 px-3 py-1.5 text-sm cursor-pointer">
              Выберите файлы
            </span>
            <input
              type="file"
              className="hidden"
              accept={accept}
              multiple={multiple}
              onChange={handleFileSelect}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {accept} до {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      </div>

      {/* Список загруженных файлов */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">
              Выбранные файлы ({files.length})
            </h4>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Очистить все
            </Button>
          </div>
          
          <div className="space-y-2">
            {files.map((fileStatus, index) => (
              <div
                key={`${fileStatus.file.name}-${index}`}
                className="flex items-center p-3 bg-gray-50 rounded-lg"
              >
                <File className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileStatus.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(fileStatus.file.size / 1024).toFixed(1)} KB
                  </p>
                  {fileStatus.error && (
                    <p className="text-xs text-danger-600 mt-1">
                      {fileStatus.error}
                    </p>
                  )}
                </div>

                <div className="flex items-center ml-3">
                  {fileStatus.status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-success-500" />
                  )}
                  {fileStatus.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-danger-500" />
                  )}
                  
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
