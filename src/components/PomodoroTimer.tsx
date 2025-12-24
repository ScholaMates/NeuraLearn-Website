"use client";

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';

interface TimerSettings {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
}

interface PomodoroTimerProps {
    onSessionComplete: (duration: number) => void;
    settings: TimerSettings;
}

type Mode = 'focus' | 'shortBreak' | 'longBreak';

export default function PomodoroTimer({ onSessionComplete, settings }: PomodoroTimerProps) {
    const [mode, setMode] = useState<Mode>('focus');
    const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
    const [isActive, setIsActive] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize AudioContext
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playNotificationSound = () => {
        if (!audioContextRef.current) return;

        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // Drop to A4

        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
    };

    const colors = {
        focus: '#CBA6F7', // Mauve
        shortBreak: '#A6E3A1', // Green
        longBreak: '#94E2D5', // Teal
        background: '#313244', // Surface0
    };

    const getModeColor = () => colors[mode];
    const getModeDuration = () => {
        switch (mode) {
            case 'focus': return settings.focusDuration * 60;
            case 'shortBreak': return settings.shortBreakDuration * 60;
            case 'longBreak': return settings.longBreakDuration * 60;
        }
    };

    useEffect(() => {
        setTimeLeft(getModeDuration());
        setIsActive(false);
        if (timerRef.current) clearInterval(timerRef.current);
    }, [mode, settings]);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleComplete();
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, timeLeft]);

    const handleComplete = () => {
        setIsActive(false);
        if (timerRef.current) clearInterval(timerRef.current);

        playNotificationSound();

        if (mode === 'focus') {
            onSessionComplete(settings.focusDuration);
            // Logic to switch to break could be added here or manual
            // For now, let's just complete and let user decide or auto-switch
             setMode('shortBreak'); // Simple default transition
        } else {
             setMode('focus');
        }
    };

    const floatToTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    const toggleTimer = () => setIsActive(!isActive);
    
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(getModeDuration());
    };

    const skipTimer = () => {
         setIsActive(false);
         // Logic to skip to next mode...
          if (mode === 'focus') setMode('shortBreak');
          else setMode('focus');
    };

    const progress = 100 - (timeLeft / getModeDuration()) * 100;
    const radius = 120;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center space-y-8 p-8 rounded-3xl bg-mocha-base/50 backdrop-blur-sm shadow-xl border border-mocha-surface0">
            {/* Mode Selectors */}
            <div className="flex gap-4 p-1 rounded-full bg-mocha-surface0">
                {(['focus', 'shortBreak', 'longBreak'] as Mode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                            mode === m 
                                ? `bg-${m === 'focus' ? 'mocha-mauve' : m === 'shortBreak' ? 'mocha-green' : 'mocha-teal'} text-mocha-base` 
                                : 'text-mocha-subtext0 hover:text-mocha-text'
                        }`}
                        style={{
                            backgroundColor: mode === m ? getModeColor() : 'transparent',
                            color: mode === m ? '#1e1e2e' : undefined
                        }}
                    >
                        {m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
                    </button>
                ))}
            </div>

            {/* Timer Visual */}
            <div className="relative flex items-center justify-center">
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    className="transform -rotate-90 transition-all duration-500"
                >
                    <circle
                        stroke={colors.background}
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        fill="transparent"
                    />
                    <circle
                        stroke={getModeColor()}
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset }}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        fill="transparent"
                        className="transition-all duration-1000 ease-in-out"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-bold font-space text-mocha-text tracking-wider">
                        {floatToTime(timeLeft)}
                    </span>
                    <span className="text-mocha-subtext0 mt-2 uppercase tracking-widest text-sm font-medium">
                        {isActive ? 'Running' : 'Paused'}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
                <button
                    onClick={toggleTimer}
                    className="p-6 rounded-full bg-mocha-surface0 text-mocha-text hover:bg-mocha-surface1 hover:scale-110 transition-all shadow-lg border border-mocha-surface1"
                    aria-label={isActive ? "Pause timer" : "Start timer"}
                >
                    {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>

                <button
                    onClick={skipTimer}
                    className="p-3 rounded-full text-mocha-subtext0 hover:bg-mocha-surface0 hover:text-mocha-text transition-all"
                    aria-label="Skip current session"
                >
                    <SkipForward size={24} />
                </button>
                 <button
                    onClick={resetTimer}
                    className="p-3 rounded-full text-mocha-subtext0 hover:bg-mocha-surface0 hover:text-mocha-text transition-all"
                    aria-label="Reset timer"
                >
                    <RotateCcw size={24} />
                </button>
            </div>
        </div>
    );
}
