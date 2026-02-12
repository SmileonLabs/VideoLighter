import { Translation, Language } from './types';

export const TRANSLATIONS: Record<Language, Translation> = {
  en: {
    dropText: "Drop your videos here to lighten",
    browse: "Browse Files",
    files: "File Queue",
    queued: "Queued",
    processing: "Processing...",
    completed: "Done",
    settings: "Conversion Settings",
    format: "Output Format",
    quickMp4: "Quick MP4",
    createGif: "Create GIF",
    resolution: "Resolution Scaling",
    optimize720: "720p Optimization",
    audio: "Audio Control",
    removeAudio: "Remove Audio (Mute)",
    fileMgmt: "File Management",
    moveToTrash: "Move original to Trash after compression",
    trashWarning: "Original files are moved to the system trash and can be recovered.",
    start: "Start Compression",
    totalProgress: "Total Progress",
    eta: "ETA",
    remove: "Remove",
    theme: "Theme",
    language: "Language",
    waiting: "Waiting"
  },
  ko: {
    dropText: "동영상을 이곳에 드래그하여 용량을 줄이세요",
    browse: "파일 찾기",
    files: "파일 대기열",
    queued: "대기 중",
    processing: "처리 중...",
    completed: "완료",
    settings: "변환 설정",
    format: "출력 형식",
    quickMp4: "빠른 MP4 변환",
    createGif: "GIF 만들기",
    resolution: "해상도 조절",
    optimize720: "720p 최적화",
    audio: "오디오 설정",
    removeAudio: "오디오 제거 (음소거)",
    fileMgmt: "파일 관리",
    moveToTrash: "압축 후 원본 휴지통으로 이동",
    trashWarning: "원본 파일은 시스템 휴지통으로 이동되며 복구할 수 있습니다.",
    start: "압축 시작",
    totalProgress: "전체 진행률",
    eta: "남은 시간",
    remove: "삭제",
    theme: "테마",
    language: "언어",
    waiting: "대기"
  }
};

export const FORMAT_OPTIONS = ['MP4', 'MOV', 'GIF'] as const;
export const RESOLUTION_OPTIONS = ['Original', '1080p', '720p', '480p'] as const;