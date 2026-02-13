import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const CoreTech: React.FC = () => {
    const { t } = useTranslation();
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 100;
        setSliderPos(Math.min(Math.max(x, 0), 100));
    };

    const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

    return (
        <section className="py-24 bg-[#06070a] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#06070a] via-[#11121d]/30 to-[#06070a]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Visual Side: Split Screen Comparison */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>

                        <div
                            ref={containerRef}
                            onMouseMove={onMouseMove}
                            onTouchMove={onTouchMove}
                            className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl cursor-ew-resize select-none"
                        >
                            {/* Background Layer: Optimized (Good Quality) */}
                            <div className="absolute inset-0">
                                <img
                                    src="https://picsum.photos/id/16/1200/800"
                                    alt="Optimized footage"
                                    className="w-full h-full object-cover filter contrast-[1.1] saturate-[1.1] brightness-[1.1]"
                                />
                                <div className="absolute bottom-6 right-6 bg-[#001219]/80 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] text-indigo-400 font-black border border-indigo-400/30 uppercase tracking-[0.2em] shadow-xl z-20">
                                    {t('technology.optimized')} (850 MB)
                                </div>

                                {/* Floating Particles Effect (Optimized Side) */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" />
                                    <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                    <div className="absolute bottom-1/3 right-1/5 w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
                                </div>
                            </div>

                            {/* Top Layer: Source (Bad Quality) - Clipped */}
                            <div
                                className="absolute inset-0 z-10 overflow-hidden pointer-events-none"
                                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                            >
                                <img
                                    src="https://picsum.photos/id/16/1200/800"
                                    alt="Original footage"
                                    className="w-full h-full object-cover filter blur-[4px] contrast-[0.85] grayscale-[20%] brightness-[0.9]"
                                />
                                <div className="absolute bottom-6 left-6 bg-[#1a0000]/80 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] text-rose-500 font-black border border-rose-500/30 uppercase tracking-[0.2em] shadow-xl">
                                    {t('technology.source')} (5.2 GB)
                                </div>
                            </div>

                            {/* Slider Handle */}
                            <div
                                className="absolute inset-y-0 z-30 pointer-events-none"
                                style={{ left: `${sliderPos}%` }}
                            >
                                <div className="absolute inset-y-0 -left-[1px] w-[2px] bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
                                <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-2xl flex items-center justify-center">
                                    <div className="flex gap-1">
                                        <div className="w-[1.5px] h-3 bg-slate-300 rounded-full" />
                                        <div className="w-[1.5px] h-3 bg-slate-300 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 text-center text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] opacity-60">
                            Native SVT-AV1 Optimization Engine v2.1 (PRO)
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="space-y-6 lg:pl-8">
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[0.95]">
                            {t('technology.title_1')}<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-400">{t('technology.title_2')}</span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed font-medium">
                            {t('technology.desc')}
                        </p>
                        <ul className="space-y-5 pt-4">
                            <li className="flex items-start gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mt-1 shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black uppercase tracking-widest text-xs">{t('technology.feature1_title')}</h4>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">{t('technology.feature1_desc')}</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/5 flex items-center justify-center mt-1 shrink-0 border border-white/5 group-hover:bg-indigo-500/10 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black uppercase tracking-widest text-xs">{t('technology.feature2_title')}</h4>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">{t('technology.feature2_desc')}</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CoreTech;
