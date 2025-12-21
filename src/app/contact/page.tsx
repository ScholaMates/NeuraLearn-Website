"use client";

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

export default function Contact() {
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Header Animation
        if (headerRef.current) {
            animate(
                headerRef.current.children,
                {
                    translateY: [20, 0],
                    opacity: [0, 1],
                    delay: stagger(100),
                    duration: 800,
                    easing: 'easeOutExpo'
                }
            );
        }

        // Cards Animation
        const cards = document.querySelectorAll('.contact-card');
        if (cards.length > 0) {
            animate(
                cards,
                {
                    opacity: [0, 1],
                    translateY: [50, 0],
                    scale: [0.8, 1],
                    duration: 200,
                    delay: stagger(150, { start: 200 }),
                    easing: 'easeOutElastic(1, .6)'
                }
            );
        }
    }, []);

    const contacts = [
        {
            icon: <Phone className="h-8 w-8 text-mocha-blue" />,
            title: "Phone",
            value: "+1 (555) 123-4567",
            action: "Call Now",
            link: "tel:+15551234567",
            color: "group-hover:text-mocha-blue"
        },
        {
            icon: <MessageCircle className="h-8 w-8 text-mocha-green" />,
            title: "WhatsApp",
            value: "+1 (555) 987-6543",
            action: "Chat Now",
            link: "https://wa.me/15559876543",
            color: "group-hover:text-mocha-green"
        },
        {
            icon: <MapPin className="h-8 w-8 text-mocha-red" />,
            title: "Address",
            value: "South PrimeOne School, Harjosari II, Kec. Medan Amplas, Kota Medan, Sumatera Utara",
            action: "Open Maps",
            link: "https://maps.app.goo.gl/j2YsNumC6ovXkmmo9",
            color: "group-hover:text-mocha-red"
        },
        {
            icon: <Mail className="h-8 w-8 text-mocha-mauve" />,
            title: "Email",
            value: "hello@neuralearn.com",
            action: "Send Email",
            link: "mailto:hello@neuralearn.com",
            color: "group-hover:text-mocha-mauve"
        }
    ];

    return (
        <div className="min-h-screen bg-mocha-base text-mocha-text pt-24 pb-16 font-space">
            <div className="container mx-auto px-6 max-w-5xl">
                {/* Header */}
                <div ref={headerRef} className="text-center mb-16">
                    <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-mocha-text sm:text-6xl opacity-0">
                        <span className="drop-shadow-[0_0_15px_rgba(203,166,247,0.5)]">Get in Touch</span>
                    </h1>
                    <p className="text-xl text-mocha-subtext0 opacity-0">
                        Have questions? We'd love to hear from you.
                    </p>
                </div>

                {/* Contact Grid */}
                <div className="grid gap-8 md:grid-cols-2">
                    {contacts.map((contact, index) => (
                        <div
                            key={index}
                            className="contact-card group relative flex flex-col items-center rounded-2xl bg-mocha-surface0 p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-mocha-surface1 border border-transparent hover:border-mocha-mauve/40 hover:shadow-[0_0_30px_rgba(203,166,247,0.15)] opacity-0"
                        >
                            <div className="mb-6 rounded-full bg-mocha-base p-5 shadow-lg ring-1 ring-mocha-surface2 transition-all group-hover:ring-mocha-mauve/50 group-hover:shadow-[0_0_20px_rgba(203,166,247,0.4)]">
                                {contact.icon}
                            </div>

                            <h3 className={`mb-2 text-2xl font-bold text-mocha-text transition-colors ${contact.color}`}>
                                {contact.title}
                            </h3>

                            <p className="mb-8 text-lg text-mocha-subtext0 font-medium">
                                {contact.value}
                            </p>

                            <a
                                href={contact.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-auto w-full rounded-xl bg-mocha-surface2 px-6 py-3 font-semibold text-mocha-text transition-all hover:bg-mocha-mauve hover:text-mocha-base hover:shadow-[0_0_15px_rgba(203,166,247,0.4)]"
                            >
                                {contact.action}
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
