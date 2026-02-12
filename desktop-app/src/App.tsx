import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SettingsPanel } from './components/SettingsPanel';
import { BottomBar } from './components/BottomBar';
import { LegalModal } from './components/LegalModal';
import { VideoFile, CompressionSettings, Language } from './types';
import { TRANSLATIONS } from './constants';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { compressVideo, getFileInfo } from './lib';
import { ActivationModal } from './components/ActivationModal';

const App: React.FC = () => {
    // --- State ---
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [language, setLanguage] = useState<Language>('ko');
    const [isActivated, setIsActivated] = useState<boolean>(false);
    const [showActivation, setShowActivation] = useState<boolean>(false);
    const [isLicensingReady, setIsLicensingReady] = useState(false);

    // Initial Activation Check
    useEffect(() => {
        const stored = localStorage.getItem('VL_ACTIVATED');
        if (stored === 'true') {
            setIsActivated(true);
        } else {
            // Delay showing modal for better UX
            setTimeout(() => {
                setShowActivation(true);
            }, 1000);
        }
        setIsLicensingReady(true);
    }, []);

    const [files, setFiles] = useState<VideoFile[]>([]);
    const [settings, setSettings] = useState<CompressionSettings>({
        format: 'MP4',
        resolution: 'Original',
        lockAspectRatio: true,
        compressionLevel: 5,
        removeAudio: false,
        moveToTrash: false,
        subjectiveVQ: false,
        enableHDR: false,
        enableDeshake: false,
        cleanMetadata: false,
        enableTurbo: true,
        parallelLimit: 1,
        enableWatermark: false,
        enableThumbnail: false,
        outputMode: 'Same',
        customOutputPath: undefined,
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [currentFileId, setCurrentFileId] = useState<string | null>(null);
    const [totalProgress, setTotalProgress] = useState(0);
    const [showLegal, setShowLegal] = useState(false);

    const stopFnsRef = useRef<Map<string, () => void>>(new Map());
    const activeIdsRef = useRef<Set<string>>(new Set());

    // --- Theme Effect ---
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // --- Handlers ---
    const addFiles = useCallback(async (paths: string[]) => {
        if (isProcessing) return;
        const newFilesPromises = paths.map(async (path) => {
            const name = path.split(/[\\/]/).pop() || 'Unknown';
            const info = await getFileInfo(path);
            return {
                id: crypto.randomUUID(),
                path: path,
                name: name,
                status: 'queued',
                originalSize: info.size,
                progress: 0
            } as VideoFile;
        });
        const newFiles = await Promise.all(newFilesPromises);
        setFiles(prev => [...prev, ...newFiles]);
    }, [isProcessing]);

    // Native Drag and Drop Listener for Tauri v2
    useEffect(() => {
        const unlistenPromise = getCurrentWebviewWindow().onDragDropEvent((event) => {
            if (event.payload.type === 'drop') {
                const paths = event.payload.paths;
                addFiles(paths);
            }
        });

        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, [addFiles]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleBrowse = useCallback(async () => {
        if (isProcessing) return;
        try {
            const selected = await open({
                multiple: true,
                filters: [{
                    name: 'Video',
                    extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm']
                }]
            });
            if (selected) {
                const paths = Array.isArray(selected) ? selected : (selected === null ? [] : [selected]);
                addFiles(paths);
            }
        } catch (err) {
            console.error('Failed to open file dialog:', err);
        }
    }, [isProcessing, addFiles]);

    const handleRemove = useCallback((id: string) => {
        if (isProcessing) return;
        setFiles(prev => prev.filter(f => f.id !== id));
    }, [isProcessing]);

    const handleClearAll = useCallback(() => {
        if (isProcessing) return;
        setFiles([]);
    }, [isProcessing]);

    const updateSettings = useCallback((partial: Partial<CompressionSettings>) => {
        setSettings(prev => ({ ...prev, ...partial }));
    }, []);

    const handleOpenFolder = useCallback((path: string) => {
        invoke('show_in_folder', { path });
    }, []);

    // --- Processing Logic ---
    const processFile = async (file: VideoFile) => {
        activeIdsRef.current.add(file.id);
        const nextId = Array.from(activeIdsRef.current)[0] || null;
        setCurrentFileId(nextId);

        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'processing', progress: 0 } : f));

        try {
            const path = file.path;
            const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
            const dir = path.substring(0, lastSlash);
            const filenameWithExt = path.substring(lastSlash + 1);
            const lastDot = filenameWithExt.lastIndexOf('.');
            const filename = lastDot !== -1 ? filenameWithExt.substring(0, lastDot) : filenameWithExt;

            const ext = settings.format.toLowerCase();
            const resolutionSuffix = settings.resolution === 'Original' ? '' : `_${settings.resolution}`;

            let outDir = dir;
            if (settings.outputMode === 'Custom' && settings.customOutputPath) {
                outDir = settings.customOutputPath;
            }

            const outputPath = `${outDir}\\${filename}_compressed${resolutionSuffix}.${ext}`;

            const { promise, stop } = compressVideo(
                file.path,
                outputPath,
                settings,
                (progress) => {
                    setFiles(prev => prev.map(f => f.id === file.id ? { ...f, progress: progress.percent } : f));
                }
            );

            stopFnsRef.current.set(file.id, stop);
            await promise;

            const outputInfo = await getFileInfo(outputPath);

            if (settings.moveToTrash) {
                try {
                    await invoke('move_to_trash', { path: file.path });
                } catch (e) {
                    console.error('Failed to move original file to trash:', e);
                }
            }

            setFiles(prev => prev.map(f => f.id === file.id ? {
                ...f,
                status: 'completed',
                progress: 100,
                compressedSize: outputInfo.size,
                outputPath: outputPath
            } : f));
        } catch (error: any) {
            if (error.message === 'STOPPED') {
                setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'queued', progress: 0 } : f));
            } else {
                console.error(`Error processing file ${file.name}: `, error);
                setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error', progress: 0 } : f));
            }
        } finally {
            activeIdsRef.current.delete(file.id);
            stopFnsRef.current.delete(file.id);
            const nextId = Array.from(activeIdsRef.current)[0] || null;
            setCurrentFileId(nextId);

            // Check if all done
            setFiles(currentFiles => {
                const total = currentFiles.length;
                const done = currentFiles.filter(f => f.status === 'completed' || f.status === 'error').length;
                setTotalProgress(total > 0 ? (done / total) * 100 : 0);

                if (done === total && isProcessing) {
                    setIsProcessing(false);
                }
                return currentFiles;
            });
        }
    };

    // Auto-spawn tasks
    useEffect(() => {
        if (!isProcessing) return;

        const queued = files.filter(f => f.status === 'queued' && !activeIdsRef.current.has(f.id));
        const activeCount = activeIdsRef.current.size;
        const canSpawn = settings.parallelLimit - activeCount;

        if (canSpawn > 0 && queued.length > 0) {
            queued.slice(0, canSpawn).forEach(file => {
                processFile(file);
            });
        }

        if (activeCount === 0 && queued.length === 0) {
            setIsProcessing(false);
        }
    }, [isProcessing, files, settings.parallelLimit]);

    const startCompression = useCallback(() => {
        if (!isActivated) {
            setShowActivation(true);
            return;
        }

        if (isProcessing) {
            // Stop everything
            stopFnsRef.current.forEach(stop => stop());
            stopFnsRef.current.clear();
            activeIdsRef.current.clear();
            setIsProcessing(false);
            return;
        }

        const hasQueued = files.some(f => f.status === 'queued');
        const allDone = files.length > 0 && files.every(f => f.status === 'completed');

        if (!hasQueued && allDone) {
            setFiles(prev => prev.map(f => ({ ...f, status: 'queued', progress: 0 })));
        }

        setIsProcessing(true);
        setTotalProgress(0);
    }, [files, isProcessing, isActivated]);

    return (
        <div className="flex flex-col h-screen w-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-hidden">
            <Header
                theme={theme}
                setTheme={setTheme}
                language={language}
                setLanguage={setLanguage}
            />
            <main className="flex-1 flex overflow-hidden">
                <div className="w-full lg:w-3/5 border-r border-gray-200 dark:border-slate-800 h-full flex flex-col">
                    <Sidebar
                        files={files}
                        onDrop={handleDrop}
                        onBrowse={handleBrowse}
                        onRemove={handleRemove}
                        onClearAll={handleClearAll}
                        onOpenFolder={handleOpenFolder}
                        t={TRANSLATIONS[language]}
                    />
                </div>
                <div className="hidden lg:flex lg:w-2/5 h-full flex-col">
                    <SettingsPanel
                        settings={settings}
                        updateSettings={updateSettings}
                        t={TRANSLATIONS[language]}
                        isProcessing={isProcessing}
                        filesCount={files.length}
                        totalSize={files.reduce((acc, f) => acc + f.originalSize, 0)}
                        onOpenLegal={() => setShowLegal(true)}
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

            <LegalModal
                isOpen={showLegal}
                onClose={() => setShowLegal(false)}
                t={TRANSLATIONS[language]}
                language={language}
            />

            <ActivationModal
                isOpen={showActivation}
                onClose={() => setShowActivation(false)}
                onActivated={() => {
                    setIsActivated(true);
                    localStorage.setItem('VL_ACTIVATED', 'true');
                }}
                t={TRANSLATIONS[language]}
                isDark={theme === 'dark'}
                currentLanguage={language}
                onLanguageChange={(lang) => setLanguage(lang)}
            />
        </div>
    );
};

export default App;
