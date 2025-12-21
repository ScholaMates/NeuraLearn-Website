"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { animate, stagger, Timeline } from 'animejs';

export default function Hero() {
    const headlineRef = useRef<HTMLHeadingElement>(null);
    const subtextRef = useRef<HTMLParagraphElement>(null);
    const descRef = useRef<HTMLParagraphElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);
    const blob1Ref = useRef<HTMLDivElement>(null);
    const blob2Ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Safe target resolution
        const elements = [headlineRef.current, subtextRef.current, descRef.current, buttonsRef.current].filter(Boolean);

        // Staggered Elastic Entrance
        const tl = new Timeline({
            duration: 1000,
            easing: 'easeOutExpo',
        });

        if (elements.length > 0) {
            tl.add(
                elements as HTMLElement[],
                {
                    translateY: [50, 0],
                    scale: [0.8, 1],
                    opacity: [0, 1],
                    delay: stagger(150),
                    easing: 'easeOutElastic(1, .6)'
                }
            );
        }

        // Floating Blobs
        if (blob1Ref.current) {
            animate(
                blob1Ref.current,
                {
                    translateY: -30,
                    translateX: 20,
                    duration: 5000,
                    direction: 'alternate',
                    loop: true,
                    easing: 'easeInOutSine'
                }
            );
        }

        if (blob2Ref.current) {
            animate(
                blob2Ref.current,
                {
                    translateY: 40,
                    translateX: -30,
                    duration: 7000,
                    direction: 'alternate',
                    loop: true,
                    easing: 'easeInOutSine'
                }
            );
        }
    }, []);

    return (
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
            {/* Background gradients */}
            <div
                ref={blob1Ref}
                className="absolute top-0 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-mocha-mauve/30 blur-[100px] mix-blend-screen"
            />
            <div
                ref={blob2Ref}
                className="absolute bottom-0 right-0 -z-10 h-[400px] w-[400px] rounded-full bg-mocha-blue/30 blur-[100px] mix-blend-screen"
            />

            <div className="container mx-auto px-4 text-center">
                <h1 ref={headlineRef} className="mb-6 text-5xl font-extrabold tracking-tight text-mocha-text sm:text-7xl opacity-0">
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-mocha-blue to-mocha-sapphire drop-shadow-[0_0_15px_rgba(137,180,250,0.5)]">NeuraLearn</span>
                    <br />
                    <span className="text-4xl sm:text-6xl text-mocha-overlay2 drop-shadow-lg">Focus. Learn. Grow.</span>
                </h1>
                <p ref={subtextRef} className="mx-auto mb-6 max-w-2xl text-lg text-mocha-subtext0 sm:text-xl opacity-0 drop-shadow-md">
                    In a world of constant digital distraction, students need tools that help them focus, not pull them away.
                </p>
                <p ref={descRef} className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-mocha-subtext1 opacity-0">
                    NeuraLearn is a small, friendly device that sits on a student's desk, providing on-demand academic assistance without the distractions of a multi-purpose device.
                </p>
                <div ref={buttonsRef} className="flex flex-col items-center justify-center gap-4 sm:flex-row opacity-0">
                    <Link
                        href="/signup"
                        className="rounded-full bg-mocha-mauve px-8 py-4 text-lg font-semibold text-mocha-base transition-all duration-300 hover:scale-105 hover:bg-mocha-pink border border-mocha-mauve/50 shadow-[0_0_20px_rgba(203,166,247,0.3)] hover:shadow-[0_0_35px_rgba(203,166,247,0.6)]"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </section>
    );
}
