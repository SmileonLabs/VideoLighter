export interface VideoFile {
  id: string;
  file: File;
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
  originalSize: number;
  compressedSize?: number;
  progress: number;
}

export type OutputFormat = 'MP4' | 'MOV' | 'GIF';
export type Resolution = 'Original' | '1080p' | '720p' | '480p';

export interface CompressionSettings {
  format: OutputFormat;
  resolution: Resolution;
  removeAudio: boolean;
  moveToTrash: boolean;
}

export type Language = 'en' | 'ko';

export interface Translation {
  dropText: string;
  browse: string;
  files: string;
  queued: string;
  processing: string;
  completed: string;
  settings: string;
  format: string;
  quickMp4: string;
  createGif: string;
  resolution: string;
  optimize720: string;
  audio: string;
  removeAudio: string;
  fileMgmt: string;
  moveToTrash: string;
  trashWarning: string;
  start: string;
  totalProgress: string;
  eta: string;
  remove: string;
  theme: string;
  language: string;
  waiting: string;
}