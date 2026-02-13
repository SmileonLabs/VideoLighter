import React from 'react';
import { FEATURES } from '../constants';
import GlassCard from './ui/GlassCard';
import { Zap, Wand2, ShieldCheck, Sparkles } from 'lucide-react';

const FeaturesGrid: React.FC = () => {
    const getIcon = (name: string) => {
        switch (name) {
            case 'Wand2': return <Wand2 className="w-6 h-6 text-primary" />;
            case 'Zap': return <Zap className="w-6 h-6 text-primary" />;
            case 'ShieldCheck': return <ShieldCheck className="w-6 h-6 text-primary" />;
            case 'Sparkles': return <Sparkles className="w-6 h-6 text-primary" />;
            default: return null;
        }
    };

    return (
        <section id="features" className="py-24 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
                        Engineered for Perfection
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        We combined the latest in perceptual video encoding with a native, high-performance architecture.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FEATURES.map((feature) => (
                        <GlassCard key={feature.id} hoverEffect className="group">
                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                {getIcon(feature.iconName)}
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesGrid;
