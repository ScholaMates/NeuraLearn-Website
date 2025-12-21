"use client";

import { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';

export default function FAQ() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const answerRefs = useRef<(HTMLDivElement | null)[]>([]);

    const faqs = [
        {
            question: "Question A",
            answer: "Answer A"
        },
        {
            question: "Question B",
            answer: "Answer B"
        },
        {
            question: "Question C",
            answer: "Answer C"
        },
        {
            question: "Question D",
            answer: "Answer D"
        },
    ];

    const toggleFAQ = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    // Staggered Entrance Animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animate(
                            '.faq-item',
                            {
                                opacity: [0, 1],
                                translateY: [20, 0],
                                duration: 600,
                                delay: stagger(100),
                                easing: 'easeOutQuad'
                            }
                        );
                        observer.disconnect();
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

    // Dropdown Height Animation
    useEffect(() => {
        answerRefs.current.forEach((ref, index) => {
            if (!ref) return;

            const isOpen = index === activeIndex;

            if (isOpen) {
                // Animate open
                animate(ref, {
                    height: [0, ref.scrollHeight],
                    opacity: [0, 1],
                    duration: 300,
                    easing: 'easeOutQuad',
                });
            } else {
                // Animate close
                if (ref.clientHeight > 0 || ref.style.height !== '0px') {
                    animate(ref, {
                        height: 0,
                        opacity: 0,
                        duration: 250,
                        easing: 'easeInQuad',
                    });
                }
            }
        });
    }, [activeIndex]);

    return (
        <section id="faq" className="py-24 bg-mocha-mantle" ref={sectionRef}>
            <div className="container mx-auto px-4 max-w-3xl">
                <h2 className="mb-12 text-center text-3xl font-bold text-mocha-text sm:text-4xl">
                    Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`faq-item opacity-0 rounded-xl bg-mocha-surface0 ring-1 transition-all duration-300 overflow-hidden ${activeIndex === index ? 'ring-mocha-mauve shadow-[0_0_20px_rgba(203,166,247,0.25)] bg-mocha-surface1/50' : 'ring-mocha-surface1'}`}
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="flex w-full cursor-pointer items-center justify-between p-6 font-semibold text-mocha-text hover:text-mocha-mauve focus:outline-hidden transition-colors"
                            >
                                <span className="text-left">{faq.question}</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2.5"
                                    stroke="currentColor"
                                    className={`h-5 w-5 text-mocha-surface2 transition-transform duration-300 ${activeIndex === index ? 'rotate-180 text-mocha-mauve drop-shadow-[0_0_8px_rgba(203,166,247,0.8)]' : ''}`}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>
                            <div
                                ref={(el) => { answerRefs.current[index] = el; }}
                                className="h-0 opacity-0 overflow-hidden"
                                style={{ height: 0, opacity: 0 }}
                            >
                                <div className="px-6 pb-6 text-mocha-subtext0">
                                    <p>{faq.answer}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
