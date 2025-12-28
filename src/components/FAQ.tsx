"use client";

import { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';

export default function FAQ() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const answerRefs = useRef<(HTMLDivElement | null)[]>([]);

    const generalFaqs = [
        {
            question: "What is NeuraLearn?",
            answer: "NeuraLearn is a physical, AI-powered study companion designed to support students in their learning. It functions similarly to a smart assistant but is purpose-built for education and free from digital distractions such as social media, games, and entertainment applications."
        },
        {
            question: "What types of academic support does NeuraLearn provide?",
            answer: "NeuraLearn can assist students by: Explaining academic concepts and formulas, Solving problems step-by-step, Supporting revision and exam preparation, and Managing focused study sessions through built-in timers."
        },
        {
            question: "How do users interact with NeuraLearn?",
            answer: "Users interact with NeuraLearn primarily through voice commands by saying phrases such as, “Hey Buddy, explain this concept” or “Hey Buddy, help me solve this question.” The built-in camera also allows students to show written questions or textbook problems for guided explanations."
        },
        {
            question: "Does NeuraLearn have different teaching styles?",
            answer: "Yes. NeuraLearn offers multiple tutor modes, including structured, supportive, and encouraging styles, allowing students to choose an approach that best suits their learning preferences."
        },
        {
            question: "How does the camera feature work?",
            answer: "The camera allows students to present written academic problems to NeuraLearn. The device then analyzes the problem and provides a clear, step-by-step explanation."
        }
    ];

    const parentFaqs = [
        {
            question: "How does NeuraLearn support my child’s focus?",
            answer: "NeuraLearn minimizes distractions by offering a controlled, education-only environment. By removing access to social media and entertainment, it helps students maintain concentration during study time."
        },
        {
            question: "Is NeuraLearn safe for student use?",
            answer: "Yes. NeuraLearn is developed with student safety and privacy as priorities. The device is restricted to educational content and does not allow access to inappropriate or unrelated material."
        },
        {
            question: "How is the camera used, and does it affect privacy?",
            answer: "The camera is used solely for educational purposes, such as recognizing academic questions. It does not function as a surveillance tool, and privacy considerations are integrated into its design."
        },
        {
            question: "Can parents monitor their child’s study habits?",
            answer: "Yes. NeuraLearn tracks study sessions and time spent learning, enabling students to build productive routines and allowing parents to understand their child’s study patterns."
        },
        {
            question: "Why should parents consider NeuraLearn over a tablet or laptop?",
            answer: "Unlike multipurpose devices, NeuraLearn is designed solely for learning. This single-purpose approach supports focus, reduces digital distractions, and promotes effective study habits."
        }
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
                    {generalFaqs.map((faq, index) => (
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

                <h3 className="mt-16 mb-8 text-center text-2xl font-bold text-mocha-text">
                    Top 5 for Parents
                </h3>

                <div className="space-y-4">
                    {parentFaqs.map((faq, index) => {
                        const globalIndex = generalFaqs.length + index;
                        return (
                            <div
                                key={globalIndex}
                                className={`faq-item opacity-0 rounded-xl bg-mocha-surface0 ring-1 transition-all duration-300 overflow-hidden ${activeIndex === globalIndex ? 'ring-mocha-mauve shadow-[0_0_20px_rgba(203,166,247,0.25)] bg-mocha-surface1/50' : 'ring-mocha-surface1'}`}
                            >
                                <button
                                    onClick={() => toggleFAQ(globalIndex)}
                                    className="flex w-full cursor-pointer items-center justify-between p-6 font-semibold text-mocha-text hover:text-mocha-mauve focus:outline-hidden transition-colors"
                                >
                                    <span className="text-left">{faq.question}</span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2.5"
                                        stroke="currentColor"
                                        className={`h-5 w-5 text-mocha-surface2 transition-transform duration-300 ${activeIndex === globalIndex ? 'rotate-180 text-mocha-mauve drop-shadow-[0_0_8px_rgba(203,166,247,0.8)]' : ''}`}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                                <div
                                    ref={(el) => { answerRefs.current[globalIndex] = el; }}
                                    className="h-0 opacity-0 overflow-hidden"
                                    style={{ height: 0, opacity: 0 }}
                                >
                                    <div className="px-6 pb-6 text-mocha-subtext0">
                                        <p>{faq.answer}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
