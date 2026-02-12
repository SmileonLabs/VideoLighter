import React from 'react';
import { Settings2, Zap, Image, Video, VolumeX, AlertTriangle, Trash2 } from 'lucide-react';
import { CompressionSettings, OutputFormat, Resolution, Translation } from '../types';
import { FORMAT_OPTIONS, RESOLUTION_OPTIONS } from '../constants';

interface SettingsPanelProps {
  settings: CompressionSettings;
  updateSettings: (partial: Partial<CompressionSettings>) => void;
  t: Translation;
  isProcessing: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, updateSettings, t, isProcessing }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 p-8 overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="text-gray-400 dark:text-slate-500" size={20} />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.settings}</h2>
      </div>

      <div className="space-y-8">
        {/* Format Section */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
            {t.format}
          </label>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <select
                value={settings.format}
                onChange={(e) => updateSettings({ format: e.target.value as OutputFormat })}
                disabled={isProcessing}
                className="w-full appearance-none bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-3 disabled:opacity-50"
              >
                {FORMAT_OPTIONS.map((fmt) => (
                  <option key={fmt} value={fmt}>{fmt}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <Video size={16} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateSettings({ format: 'MP4', resolution: 'Original' })}
                disabled={isProcessing}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border transition-all ${
                  settings.format === 'MP4' && settings.resolution === 'Original'
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Zap size={14} className={settings.format === 'MP4' ? 'fill-current' : ''} />
                {t.quickMp4}
              </button>
              <button
                onClick={() => updateSettings({ format: 'GIF' })}
                disabled={isProcessing}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border transition-all ${
                  settings.format === 'GIF'
                    ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Image size={14} />
                {t.createGif}
              </button>
            </div>
          </div>
        </section>

        <hr className="border-gray-100 dark:border-slate-800" />

        {/* Resolution Section */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
            {t.resolution}
          </label>
          <div className="flex flex-col gap-3">
            <select
              value={settings.resolution}
              onChange={(e) => updateSettings({ resolution: e.target.value as Resolution })}
              disabled={isProcessing}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-3 disabled:opacity-50"
            >
              {RESOLUTION_OPTIONS.map((res) => (
                <option key={res} value={res}>{res}</option>
              ))}
            </select>

            <button
              onClick={() => updateSettings({ resolution: '720p' })}
              disabled={isProcessing}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-dashed transition-all ${
                settings.resolution === '720p'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-600'
              }`}
            >
              <Zap size={16} />
              {t.optimize720}
            </button>
          </div>
        </section>

        <hr className="border-gray-100 dark:border-slate-800" />

        {/* Audio Section */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
            {t.audio}
          </label>
          <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
            settings.removeAudio 
              ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' 
              : 'bg-gray-50 dark:bg-slate-900 border-transparent hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}>
            <input
              type="checkbox"
              checked={settings.removeAudio}
              onChange={(e) => updateSettings({ removeAudio: e.target.checked })}
              disabled={isProcessing}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-slate-200 flex items-center gap-2">
              <VolumeX size={16} className={settings.removeAudio ? 'text-red-500' : 'text-gray-400'} />
              {t.removeAudio}
            </span>
          </label>
        </section>

        <hr className="border-gray-100 dark:border-slate-800" />

        {/* File Management Section */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
            {t.fileMgmt}
          </label>
          <div className="space-y-2">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={settings.moveToTrash}
                onChange={(e) => updateSettings({ moveToTrash: e.target.checked })}
                disabled={isProcessing}
                className="mt-1 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-slate-300">
                {t.moveToTrash}
              </span>
            </label>
            
            {settings.moveToTrash && (
              <div className="flex items-start gap-2 ml-7 p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{t.trashWarning}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};