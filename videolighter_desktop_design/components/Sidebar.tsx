import React, { useRef } from 'react';
import { UploadCloud, FileVideo, X, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { VideoFile, Translation } from '../types';

interface SidebarProps {
  files: VideoFile[];
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onBrowse: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  t: Translation;
}

export const Sidebar: React.FC<SidebarProps> = ({ files, onDrop, onBrowse, onRemove, t }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900/50 p-6 gap-6 overflow-hidden">
      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 hover:border-primary-500 dark:hover:border-primary-500 transition-all cursor-pointer shadow-sm hover:shadow-md h-48 shrink-0"
      >
        <div className="w-12 h-12 mb-4 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-110 transition-transform">
          <UploadCloud size={24} />
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-300 font-medium text-center">
          {t.dropText}
        </p>
        <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">
          MP4, MOV, MKV, AVI
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onBrowse}
          className="hidden"
          multiple
          accept="video/*"
        />
      </div>

      {/* File List */}
      <div className="flex flex-col flex-1 min-h-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          {t.files} 
          {files.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-slate-800 text-xs font-normal text-gray-600 dark:text-slate-400">
              {files.length}
            </span>
          )}
        </h2>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {files.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-600 opacity-50">
              <FileVideo size={48} className="mb-2" />
              <p className="text-sm">No files queued</p>
            </div>
          ) : (
            files.map((file) => (
              <div 
                key={file.id}
                className="group relative flex items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md"
              >
                {/* Icon based on status */}
                <div className="mr-3 shrink-0">
                  {file.status === 'completed' ? (
                    <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
                      <CheckCircle2 size={20} />
                    </div>
                  ) : file.status === 'processing' ? (
                    <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                      <Loader2 size={20} className="animate-spin" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center">
                      <FileVideo size={20} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 mr-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate" title={file.file.name}>
                    {file.file.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 dark:text-slate-500">
                      {formatSize(file.originalSize)}
                    </span>
                    {file.status === 'queued' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
                        <Clock size={10} /> {t.queued}
                      </span>
                    )}
                    {file.status === 'processing' && (
                       <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                         {Math.round(file.progress)}%
                       </span>
                    )}
                  </div>
                  {/* Inline Progress Bar for processing items */}
                  {file.status === 'processing' && (
                    <div className="mt-1.5 h-1 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 transition-all duration-300 ease-out"
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                {file.status !== 'processing' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(file.id);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title={t.remove}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};