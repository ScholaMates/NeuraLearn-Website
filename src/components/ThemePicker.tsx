"use client";

import { useEffect, useState } from 'react';
import { Palette, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';

type Theme = 'latte' | 'frappe' | 'macchiato' | 'mocha';

const themes: { id: Theme; label: string; color: string }[] = [
    { id: 'latte', label: 'Latte (Light)', color: '#eff1f5' },
    { id: 'frappe', label: 'Frappé', color: '#303446' },
    { id: 'macchiato', label: 'Macchiato', color: '#24273a' },
    { id: 'mocha', label: 'Mocha', color: '#1e1e2e' },
];

export default function ThemePicker() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<Theme>('mocha');

    useEffect(() => {
        // Load theme from local storage or system preference
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme && themes.some(t => t.id === savedTheme)) {
            setTheme(savedTheme);
        } else {
            // Default to Mocha
            setTheme('mocha');
        }
    }, []);

    const setTheme = (theme: Theme) => {
        document.documentElement.classList.remove('latte', 'frappe', 'macchiato', 'mocha');
        document.documentElement.classList.add(theme);
        localStorage.setItem('theme', theme);
        setCurrentTheme(theme);
        setIsOpen(false);
        const label = themes.find(t => t.id === theme)?.label;
        toast.success(`Theme changed to ${label}`);
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-full p-2 text-mocha-subtext0 hover:bg-mocha-surface1 hover:text-mocha-mauve transition-all"
                aria-label="Change theme"
            >
                <Palette size={20} />
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-mocha-base rounded-xl border border-mocha-surface1 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-3 py-2 text-xs font-semibold text-mocha-subtext0 uppercase tracking-wider">
                            Select Theme
                        </div>
                        {themes.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => setTheme(theme.id)}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors
                                    ${currentTheme === theme.id 
                                        ? 'bg-mocha-surface0 text-mocha-mauve font-medium' 
                                        : 'text-mocha-text hover:bg-mocha-surface0 hover:text-mocha-mauve'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-4 h-4 rounded-full border border-mocha-surface1" 
                                        style={{ backgroundColor: theme.color }}
                                    />
                                    {theme.label}
                                </div>
                                {currentTheme === theme.id && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
