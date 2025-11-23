import React from 'react';

interface AgentCardProps {
    name: string;
    role: string;
    icon: React.ReactNode;
    color: 'purple' | 'blue' | 'green' | 'red';
    onClick: () => void;
    isLoading?: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ name, role, icon, color, onClick, isLoading }) => {
    const colorMap = {
        purple: 'border-psy-purple/30 hover:border-psy-purple/60 hover:shadow-[0_0_15px_rgba(157,0,255,0.3)]',
        blue: 'border-psy-blue/30 hover:border-psy-blue/60 hover:shadow-[0_0_15px_rgba(0,224,255,0.3)]',
        green: 'border-psy-green/30 hover:border-psy-green/60 hover:shadow-[0_0_15px_rgba(0,255,148,0.3)]',
        red: 'border-psy-red/30 hover:border-psy-red/60 hover:shadow-[0_0_15px_rgba(255,0,85,0.3)]',
    };

    const textMap = {
        purple: 'text-psy-purple',
        blue: 'text-psy-blue',
        green: 'text-psy-green',
        red: 'text-psy-red',
    };

    return (
        <div
            onClick={onClick}
            className={`
        relative group cursor-pointer
        bg-void-surface/40 backdrop-blur-sm
        border ${colorMap[color]}
        rounded-xl p-4 transition-all duration-300
        hover:-translate-y-1
      `}
        >
            <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg bg-void-surface border border-void-border ${textMap[color]}`}>
                    {isLoading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                    ) : icon}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">
                    {role}
                </div>
            </div>

            <h3 className="font-header text-lg font-bold text-gray-200 group-hover:text-white transition-colors">
                {name}
            </h3>

            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
};

export default AgentCard;
