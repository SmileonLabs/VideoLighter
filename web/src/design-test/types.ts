export interface NavItem {
    label: string;
    href: string;
}

export interface Feature {
    id: string;
    title: string;
    description: string;
    iconName: 'Zap' | 'Wand2' | 'ShieldCheck' | 'Sparkles';
}

export interface Preset {
    id: string;
    label: string;
    subLabel: string;
    active?: boolean;
}
