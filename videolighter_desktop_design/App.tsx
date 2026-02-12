import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SettingsPanel } from './components/SettingsPanel';
import { BottomBar } from './components/BottomBar';
import { VideoFile, CompressionSettings, Language } from './types';
import { TRANSLATIONS } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<Language>('en');
  
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [settings, setSettings] = useState<CompressionSettings>({
    format: 'MP4',
    resolution: 'Original',
    removeAudio: false,
    moveToTrash: false,
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [totalProgress, setTotalProgress] = useState(0);

  // --- Theme Effect ---
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- Handlers ---

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isProcessing) return;

    const droppedFiles = Array.from(e.dataTransfer.files)
      .map(f => f as File)
      .filter(f => f.type.startsWith('video/'));
    addFiles(droppedFiles);
  }, [isProcessing]);

  const handleBrowse = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !isProcessing) {
      const selectedFiles = Array.from(e.target.files)
        .map(f => f as File)
        .filter(f => f.type.startsWith('video/'));
      addFiles(selectedFiles);
    }
    // Reset input to allow selecting same files again
    e.target.value = '';
  }, [isProcessing]);

  const addFiles = (newFiles: File[]) => {
    const videoFiles: VideoFile[] = newFiles.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      status: 'queued',
      originalSize: f.size,
      progress: 0
    }));
    setFiles(prev => [...prev, ...videoFiles]);
  };

  const handleRemove = useCallback((id: string) => {
    if (isProcessing) return;
    setFiles(prev => prev.filter(f => f.id !== id));
  }, [isProcessing]);

  const updateSettings = useCallback((partial: Partial<CompressionSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  // --- Simulation Logic ---
  
  const processingRef = useRef<number | null>(null);

  const startCompression = useCallback(() => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setTotalProgress(0);

    // Reset completed files to queued if retrying? 
    // For this MVP, let's assume we only process 'queued' files. 
    // If all are completed, maybe reset them?
    const filesToProcess = files.filter(f => f.status === 'queued' || f.status === 'idle');
    if (filesToProcess.length === 0) {
      // If user clicks start and everything is done, reset all to queued
       setFiles(prev => prev.map(f => ({ ...f, status: 'queued', progress: 0 })));
       // Wait a tick then restart logic would be complex in one go, so let's just return and let user click again? 
       // Or better: auto-reset logic inside the effect.
       // For simplicity: process any queued files. If none, do nothing.
    }
  }, [files]);

  useEffect(() => {
    if (!isProcessing) return;

    const processNext = () => {
      setFiles(currentFiles => {
        // Find next queued file
        const nextIndex = currentFiles.findIndex(f => f.status === 'queued');
        
        if (nextIndex === -1) {
          // All done
          setIsProcessing(false);
          setTotalProgress(100);
          setCurrentFileId(null);
          return currentFiles;
        }

        const nextFile = currentFiles[nextIndex];
        setCurrentFileId(nextFile.id);
        
        // Update status to processing
        const newFiles = [...currentFiles];
        newFiles[nextIndex] = { ...nextFile, status: 'processing', progress: 0 };
        return newFiles;
      });
    };

    // If no file is currently processing, start next
    if (!currentFileId) {
      processNext();
    } else {
      // Simulate progress for current file
      const interval = setInterval(() => {
        setFiles(currentFiles => {
          const index = currentFiles.findIndex(f => f.id === currentFileId);
          if (index === -1) return currentFiles;

          const file = currentFiles[index];
          const increment = Math.random() * 5 + 1; // Random speed
          const newProgress = Math.min(file.progress + increment, 100);

          const updatedFiles = [...currentFiles];
          
          if (newProgress >= 100) {
            updatedFiles[index] = { ...file, status: 'completed', progress: 100 };
            setCurrentFileId(null); // Will trigger processNext in next effect run
          } else {
            updatedFiles[index] = { ...file, progress: newProgress };
          }
          
          // Calculate total progress
          const total = updatedFiles.reduce((acc, f) => {
             if (f.status === 'completed') return acc + 100;
             if (f.status === 'processing') return acc + f.progress;
             return acc;
          }, 0);
          setTotalProgress(total / updatedFiles.length);

          return updatedFiles;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isProcessing, currentFileId]);


  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <Header 
        theme={theme} 
        setTheme={setTheme} 
        language={language}
        setLanguage={setLanguage}
      />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: 60% on large screens, full on mobile if tabs used (but here we split view) */}
        <div className="w-full lg:w-3/5 border-r border-gray-200 dark:border-slate-800 h-full flex flex-col">
          <Sidebar 
            files={files} 
            onDrop={handleDrop} 
            onBrowse={handleBrowse} 
            onRemove={handleRemove}
            t={TRANSLATIONS[language]}
          />
        </div>

        {/* Right Panel: 40% */}
        <div className="hidden lg:flex lg:w-2/5 h-full flex-col">
          <SettingsPanel 
            settings={settings} 
            updateSettings={updateSettings} 
            t={TRANSLATIONS[language]}
            isProcessing={isProcessing}
          />
        </div>
      </main>

      <BottomBar 
        onStart={startCompression} 
        isProcessing={isProcessing}
        totalProgress={totalProgress}
        currentFileId={currentFileId}
        files={files}
        t={TRANSLATIONS[language]}
      />
    </div>
  );
};

export default App;