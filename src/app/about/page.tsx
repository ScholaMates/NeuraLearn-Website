"use client";

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { } from 'lucide-react';

export default function About() {
    const headlineRef = useRef<HTMLHeadingElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const teamTitleRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        // Mission Section Animation
        if (headlineRef.current && textRef.current) {
            animate(
                [headlineRef.current, textRef.current],
                {
                    translateY: [20, 0],
                    opacity: [0, 1],
                    delay: stagger(200),
                    duration: 800,
                    easing: 'easeOutExpo'
                }
            );
        }

        // Team Section Title Animation
        if (teamTitleRef.current) {
            animate(
                teamTitleRef.current,
                {
                    translateY: [20, 0],
                    opacity: [0, 1],
                    delay: 400,
                    duration: 800,
                    easing: 'easeOutExpo'
                }
            );
        }

        // Team Cards Animation
        const cards = document.querySelectorAll('.team-card');
        if (cards.length > 0) {
            animate(
                cards,
                {
                    opacity: [0, 1],
                    translateY: [20, 0],
                    filter: ['blur(10px)', 'blur(0px)'],
                    duration: 800,
                    delay: stagger(100, { start: 600 }),
                    easing: 'easeOutExpo'
                }
            );
        }
    }, []);

    const team = [
        {
            name: "Fabio Canavarro",
            role: "Founder & CEO",
            image: "/team/fabio.jpg",
            bio: "Visionary leader with a passion for educational technology.",
            specialty: "Strategy & EdTech Innovation"
        },
        {
            name: "Clarissa Lawrence Pearl",
            role: "Lead Engineer",
            image: "/team/IMG_1508.JPG",
            bio: "Full-stack wizard ensuring our systems are robust and scalable.",
            specialty: "Scalable Architecture & IoT"
        },
        {
            name:"Chelsea Chen",
            role: "Product Designer",
            image: "/team/IMG_1509.JPG",
            bio: "Crafting beautiful and intuitive user experiences.",
            specialty: "UI/UX & Accessibility"
        },
        {
            name: "Abram Surya Matthew Sinaga",
            role: "3D Designer",
            image: "/team/IMG_1513.JPG",
            bio: "Developing the intelligent core of NeuraLearn.",
            specialty: "Drawing & Modelling"
        },
        {
            name: "Hewitt Hartanoto",
            role: "Lead Web Dev",
            image: "/team/IMG_1512.JPG",
            bio: "Developing the intelligent core of NeuraLearn.",
            specialty: "NextJS & React"
        },
        {
            name: "Jaylene Ponassis",
            role: "AI Specialist",
            image: "/team/IMG_1507.JPG",
            bio: "Developing the intelligent core of NeuraLearn.",
            specialty: "Deep Learning & NLP"
        },
        {
            name: "Arthur Stanlinov Sinaga",
            role: "AI Specialist",
            image: "/team/IMG_1510.JPG",
            bio: "Developing the intelligent core of NeuraLearn.",
            specialty: "Deep Learning & NLP"
        }
    ];

    return (
        <div className="min-h-screen bg-mocha-base text-mocha-text pt-24 pb-16 font-space">
            <div className="container mx-auto px-6">
                {/* Mission Section */}
                <section className="container mx-auto max-w-4xl text-center mb-32">
                    <h1 ref={headlineRef} className="mb-8 text-5xl font-extrabold tracking-tight text-mocha-text sm:text-6xl opacity-0">
                        <span className="drop-shadow-[0_0_15px_rgba(203,166,247,0.5)]">Our Mission</span>
                    </h1>
                    <p ref={textRef} className="text-xl leading-relaxed text-mocha-subtext0 drop-shadow-md opacity-0">
                        At NeuraLearn, we believe that <span className="text-mocha-blue font-semibold">focus is the new superpower</span>.
                        Our mission is to empower students with intelligent, distraction-free tools that foster deep learning and academic growth.
                        We are building a future where technology amplifies human potential without demanding constant attention.
                    </p>
                </section>

                {/* Team Section */}
                <section className="container mx-auto max-w-6xl">
                    <h2 ref={teamTitleRef} className="mb-16 text-center text-4xl font-bold text-mocha-text drop-shadow-[0_0_10px_rgba(137,180,250,0.5)] opacity-0">
                        Meet the Team
                    </h2>
                    <div className="flex flex-col gap-8">
                        {team.map((member, index) => (
                            <div
                                key={index}
                                className="team-card group relative flex flex-col md:flex-row overflow-hidden rounded-xl bg-mocha-surface0 ring-1 ring-mocha-surface1 transition-all duration-300 hover:shadow-[0_0_30px_rgba(203,166,247,0.15)] hover:ring-mocha-mauve/50 opacity-0"
                            >
                                {/* Left Side: Image Placeholder */}
                                <div className="flex w-full md:w-64 shrink-0 flex-col items-center justify-center bg-mocha-surface1/20 p-8">
                                    <div className="h-50 w-50 overflow-hidden rounded-xl ring-4 ring-mocha-surface2 shadow-lg transition-all group-hover:ring-mocha-mauve/50 group-hover:shadow-[0_0_20px_rgba(203,166,247,0.4)]">
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </div>

                                {/* Right Side: Content */}
                                <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                                    <div>
                                        <div className="mb-4 text-center">
                                            <h3 className="mb-1 text-2xl font-bold text-mocha-text group-hover:text-mocha-mauve transition-colors">
                                                {member.name}
                                            </h3>
                                            <p className="text-sm font-semibold uppercase tracking-wider text-mocha-blue">
                                                {member.role}
                                            </p>
                                        </div>

                                        <hr className="mb-6 border-mocha-surface1" />

                                        <p className="mb-6 text-mocha-subtext0 leading-relaxed">
                                            {member.bio}
                                        </p>
                                    </div>

                                    {/* Specialty Box */}
                                    <div className="rounded-lg bg-mocha-surface1/30 px-4 py-3 text-sm">
                                        <span className="font-bold text-mocha-text mr-2">Specialty:</span>
                                        <span className="text-mocha-subtext0">{member.specialty}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

