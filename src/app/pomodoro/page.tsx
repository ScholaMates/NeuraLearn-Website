"use client";

import PomodoroTimer from "@/components/PomodoroTimer";
import PomodoroStats from "@/components/PomodoroStats";
import PomodoroSettings from "@/components/PomodoroSettings";
import { useState } from "react";
import { Settings } from "lucide-react";

export default function PomodoroPage() {
    const [stats, setStats] = useState({
        dailyFocusTime: 0,
        sessionsCompleted: 0
    });
    const [settings, setSettings] = useState({
        focusDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        autoStartBreaks: false,
        autoStartPomodoros: false,
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleSessionComplete = (duration: number) => {
        setStats(prev => ({
            dailyFocusTime: prev.dailyFocusTime + duration,
            sessionsCompleted: prev.sessionsCompleted + 1
        }));
    };

    return (
        <main className="min-h-screen bg-mocha-base pt-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                     <div>
                        <h1 className="text-4xl font-bold text-mocha-text font-space mb-2">Focus Dashboard</h1>
                        <p className="text-mocha-subtext0">Track your productivity and stay in the flow.</p>
                     </div>
                     <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-3 rounded-xl bg-mocha-surface0 text-mocha-text hover:bg-mocha-surface1 transition-colors border border-mocha-surface1"
                        aria-label="Open settings"
                    >
                        <Settings size={24} />
                     </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Timer Section - Takes up 2 columns */}
                    <div className="lg:col-span-2">
                        <PomodoroTimer 
                            onSessionComplete={handleSessionComplete} 
                            settings={settings}
                        />
                    </div>

                    {/* Stats Section - Takes up 1 column */}
                    <div className="lg:col-span-1 h-full">
                        <PomodoroStats 
                            dailyFocusTime={stats.dailyFocusTime} 
                            sessionsCompleted={stats.sessionsCompleted} 
                        />
                    </div>
                </div>
            </div>

            <PomodoroSettings 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)}
                currentSettings={settings}
                onSave={setSettings}
            />
        </main>
    );
}
