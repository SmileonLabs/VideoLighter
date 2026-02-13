import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false }) => {
    const baseStyles = "bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 relative overflow-hidden";
    const hoverStyles = hoverEffect ? "hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10" : "";

    return (
        <div className={`${baseStyles} ${hoverStyles} ${className}`}>
            {/* Glossy reflection effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default GlassCard;
