"use client";

import { useEffect } from 'react';

type Theme = 'latte' | 'frappe' | 'macchiato' | 'mocha';

const themes: { id: Theme }[] = [
    { id: 'latte' },
    { id: 'frappe' },
    { id: 'macchiato' },
    { id: 'mocha' },
];

export default function ThemeInit() {
    useEffect(() => {
        // Load theme from local storage or system preference
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme && themes.some(t => t.id === savedTheme)) {
            document.documentElement.classList.remove('latte', 'frappe', 'macchiato', 'mocha');
            document.documentElement.classList.add(savedTheme);
        } else {
            // Default to Mocha
            document.documentElement.classList.remove('latte', 'frappe', 'macchiato', 'mocha');
            document.documentElement.classList.add('mocha');
        }
    }, []);

    return null;
}
