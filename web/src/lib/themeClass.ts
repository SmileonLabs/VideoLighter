export type ThemeMode = 'light' | 'dark';

export const themeClass = (theme: ThemeMode, lightClass: string, darkClass: string) =>
    theme === 'dark' ? darkClass : lightClass;
