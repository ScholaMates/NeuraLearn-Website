"use client";

import { Mic, Bot, Smile, Timer, Camera, FileText, Smartphone } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

const features = [
    {
        icon: <Mic className="h-8 w-8 text-mocha-red" />,
        title: 'Voice-Activated Interface',
        description: 'Hands-free interaction initiated by a custom wake word, allowing you to stay focused on your work.',
    },
    {
        icon: <Bot className="h-8 w-8 text-mocha-mauve" />,
        title: 'Switchable AI Tutors',
        description: 'Select different modes like "Socratic Tutor" for guiding questions or "Direct Answer" for quick help.',
    },
    {
        icon: <Smile className="h-8 w-8 text-mocha-yellow" />,
        title: 'Dynamic Facial Expressions',
        description: 'A color TFT screen displays rich, animated faces to convey listening, thinking, and speaking states.',
    },
    {
        icon: <Timer className="h-8 w-8 text-mocha-peach" />,
        title: 'Integrated Pomodoro Timer',
        description: 'Actively coaches students on time management and focus skills to maximize productivity.',
    },
    {
        icon: <Camera className="h-8 w-8 text-mocha-blue" />,
        title: 'Visual Problem Solving',
        description: 'Utilizes an onboard camera to interpret problems from physical documents and provide AI-powered help.',
    },
    {
        icon: <FileText className="h-8 w-8 text-mocha-green" />,
        title: 'Automated Note-Taking',
        description: 'Seamlessly integrates with Notion, Obsidian, or Google Docs to automatically log conversations.',
    },
    {
        icon: <Smartphone className="h-8 w-8 text-mocha-lavender" />,
        title: 'Companion App Integration',
        description: 'Communicates with a backend to sync history and settings with a companion web portal.',
    },
];

export default function Features() {
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animate(
                            '.feature-card',
                            {
                                opacity: [0, 1],
                                translateY: [20, 0],
                                filter: ['blur(10px)', 'blur(0px)'],
                                duration: 800,
                                delay: stagger(100),
                                easing: 'easeOutExpo'
                            }
                        );
                        observer.disconnect(); // Animate only once
                    }
                });
            },
            { threshold: 0.1 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section className="py-24 bg-mocha-mantle" ref={sectionRef}>
            <div className="container mx-auto px-4">
                <div className="mb-16 text-center">
                    <h2 className="mb-4 text-3xl font-bold text-mocha-text sm:text-4xl">
                        Hardware Features
                    </h2>
                    <p className="text-mocha-subtext0 max-w-2xl mx-auto">
                        Designed from the ground up to be the ultimate study companion.
                    </p>
                </div>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-center">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="feature-card opacity-0 group rounded-2xl bg-mocha-surface0 p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-mocha-surface1 border border-transparent hover:border-mocha-blue/30 hover:shadow-[0_0_30px_rgba(137,180,250,0.15)]"
                        >
                            <div className="mb-6 inline-block rounded-xl bg-mocha-base p-4 shadow-lg ring-1 ring-mocha-surface2 group-hover:ring-mocha-blue/50 group-hover:shadow-[0_0_15px_rgba(137,180,250,0.4)] transition-all">
                                {feature.icon}
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-mocha-text group-hover:text-mocha-blue transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-mocha-subtext0">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
