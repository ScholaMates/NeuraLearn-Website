"use client";

import { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';
import { Phone, Mail, MapPin, MessageCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function Contact() {
    const headerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

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

        // Form Animation
        if (formRef.current) {
            animate(
                formRef.current,
                {
                    opacity: [0, 1],
                    translateY: [50, 0],
                    duration: 800,
                    delay: 600,
                    easing: 'easeOutExpo'
                }
            );
        }
    }, []);

    const contacts = [
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success('Feedback sent successfully!');
                setFormData({ name: '', email: '', message: '' });
            } else {
                toast.error('Failed to send feedback. Please try again.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

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
                <div className="grid gap-8 md:grid-cols-2 mb-16">
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

                {/* Feedback Form */}
                <div className="mx-auto max-w-2xl">
                    <form
                        ref={formRef}
                        onSubmit={handleSubmit}
                        className="rounded-2xl bg-mocha-surface0 p-8 border border-mocha-mauve/20 shadow-lg opacity-0"
                    >
                        <h2 className="text-3xl font-bold mb-6 text-center text-mocha-mauve">Send us Feedback</h2>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-mocha-subtext0 mb-1">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-xl bg-mocha-base border border-mocha-surface2 px-4 py-3 text-mocha-text focus:border-mocha-mauve focus:ring-1 focus:ring-mocha-mauve transition-all"
                                    placeholder="Your Name"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-mocha-subtext0 mb-1">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full rounded-xl bg-mocha-base border border-mocha-surface2 px-4 py-3 text-mocha-text focus:border-mocha-mauve focus:ring-1 focus:ring-mocha-mauve transition-all"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-mocha-subtext0 mb-1">Message</label>
                                <textarea
                                    id="message"
                                    required
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full rounded-xl bg-mocha-base border border-mocha-surface2 px-4 py-3 text-mocha-text focus:border-mocha-mauve focus:ring-1 focus:ring-mocha-mauve transition-all resize-none"
                                    placeholder="How can we help you?"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full rounded-xl bg-mocha-mauve px-6 py-3 font-bold text-mocha-base transition-all hover:bg-mocha-pink hover:shadow-[0_0_15px_rgba(203,166,247,0.4)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="animate-spin h-5 w-5" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <MessageCircle className="h-5 w-5" />
                                        Send Feedback
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
