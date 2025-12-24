"use client";

import { X } from 'lucide-react';
import { useState } from 'react';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: any; // Define proper type
    onSave: (settings: any) => void;
}

export default function PomodoroSettings({ isOpen, onClose, currentSettings, onSave }: SettingsProps) {
    const [localSettings, setLocalSettings] = useState(currentSettings);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalSettings((prev: any) => ({
            ...prev,
            [name]: parseInt(value) || 0
        }));
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-mocha-base border border-mocha-surface1 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-mocha-text font-space">Timer Settings</h2>
                    <button onClick={onClose} className="text-mocha-subtext0 hover:text-mocha-text" aria-label="Close settings">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="focusDuration" className="text-sm font-medium text-mocha-subtext0">Focus Duration (minutes)</label>
                        <input 
                            id="focusDuration"
                            type="number" 
                            name="focusDuration"
                            className="w-full bg-mocha-surface0 border border-mocha-surface1 rounded-lg px-4 py-2 text-mocha-text focus:outline-none focus:border-mocha-mauve transition-colors"
                            value={localSettings.focusDuration}
                            onChange={handleChange}
                            min="1"
                            max="60"
                        />
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="shortBreakDuration" className="text-sm font-medium text-mocha-subtext0">Short Break (minutes)</label>
                        <input 
                            id="shortBreakDuration"
                            type="number" 
                            name="shortBreakDuration"
                            className="w-full bg-mocha-surface0 border border-mocha-surface1 rounded-lg px-4 py-2 text-mocha-text focus:outline-none focus:border-mocha-mauve transition-colors"
                            value={localSettings.shortBreakDuration}
                            onChange={handleChange}
                             min="1"
                            max="30"
                        />
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="longBreakDuration" className="text-sm font-medium text-mocha-subtext0">Long Break (minutes)</label>
                        <input 
                            id="longBreakDuration"
                            type="number" 
                            name="longBreakDuration"
                            className="w-full bg-mocha-surface0 border border-mocha-surface1 rounded-lg px-4 py-2 text-mocha-text focus:outline-none focus:border-mocha-mauve transition-colors"
                            value={localSettings.longBreakDuration}
                            onChange={handleChange}
                             min="1"
                            max="60"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                     <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-mocha-subtext0 hover:bg-mocha-surface0 hover:text-mocha-text transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg bg-mocha-mauve text-mocha-base font-medium hover:opacity-90 transition-opacity"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
