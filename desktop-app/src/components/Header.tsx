import React from 'react';
import {
    Video, Moon, Sun, Languages, Github, ExternalLink
} from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
    theme: 'light' | 'dark';
    setTheme: (t: 'light' | 'dark') => void;
    language: Language;
    setLanguage: (l: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, setTheme, language, setLanguage }) => {
    return (
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 flex items-center justify-between px-6 transition-colors duration-300">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500 rounded-xl">
                    <Video className="text-white" size={20} />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
                            VIDEOLIGHTER
                        </span>
                        <span className="text-[10px] bg-primary-500 text-white px-1.5 py-0.5 rounded-full font-bold">PRO</span>
                    </div>
                    <a
                        href="https://videolighter.smileon.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-gray-400 hover:text-primary-500 flex items-center gap-1 transition-colors font-medium"
                    >
                        videolighter.smileon.app <ExternalLink size={10} />
                    </a>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Language Selector */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-900 p-1 rounded-full border border-gray-200 dark:border-slate-800">
                    <button
                        onClick={() => setLanguage('en')}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${language === 'en'
                            ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-sm'
                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                            }`}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLanguage('ko')}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${language === 'ko'
                            ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-sm'
                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                            }`}
                    >
                        한국어
                    </button>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Toggle Theme"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
        </header>
    );
};
