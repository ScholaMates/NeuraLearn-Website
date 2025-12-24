"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import tutorModes from '@/config/tutorModes.json';
import responseLengths from '@/config/responseLengths.json';
import academicLevels from '@/config/academicLevels.json';

import models from '@/config/models.json';

export default function PersonalizationPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        nickname: '',
        tutor_mode: 'socratic',
        response_length: 'concise',
        academic_level: 'undergraduate',
        major: '',
        about_me: '',
        custom_model: 'gemini-2.5-flash',
        gemini_api_key: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/signin');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('nickname, tutor_mode, response_length, academic_level, major, about_me, custom_model, gemini_api_key')
                .eq('id', session.user.id)
                .single();

            if (data) {
                setFormData({
                    nickname: data.nickname || '',
                    tutor_mode: data.tutor_mode || 'socratic',
                    response_length: data.response_length || 'concise',
                    academic_level: data.academic_level || 'undergraduate',
                    major: data.major || '',
                    about_me: data.about_me || '',
                    custom_model: data.custom_model || 'gemini-2.5-flash',
                    gemini_api_key: data.gemini_api_key || '',
                });
            }
            setLoading(false);
        };

        fetchProfile();
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: session.user.id,
                ...formData,
                updated_at: new Date().toISOString(),
            });

        setSaving(false);

        if (error) {
            console.error('Error saving profile:', error);
            toast.error(`Failed to save changes: ${error.message}`);
        } else {
            toast.success('Profile updated successfully!');
            router.refresh();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-mocha-base flex items-center justify-center">
                <Loader2 className="animate-spin text-mocha-mauve" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-mocha-base text-mocha-text pt-20 px-4 font-space">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/chat" className="p-2 -ml-2 rounded-full hover:bg-mocha-surface1 text-mocha-subtext0 hover:text-mocha-text transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Personalization</h1>
                        <p className="text-mocha-subtext0 text-sm">Tell the AI about your preferences to get better responses.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-mocha-surface0 rounded-lg p-6 border border-mocha-surface1 shadow-sm space-y-6">
                    <div>
                        <label htmlFor="nickname" className="block text-sm font-medium text-mocha-text mb-2">
                            Nickname
                        </label>
                        <input
                            type="text"
                            id="nickname"
                            name="nickname"
                            value={formData.nickname}
                            onChange={handleChange}
                            placeholder="What should the AI call you?"
                            className="block w-full rounded-md border-0 bg-mocha-surface1 py-2 px-3 text-mocha-text ring-1 ring-inset ring-mocha-surface2 placeholder:text-mocha-overlay0 focus:ring-2 focus:ring-inset focus:ring-mocha-mauve sm:text-sm sm:leading-6"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="custom_model" className="block text-sm font-medium text-mocha-text mb-2">
                                AI Model Preference
                            </label>
                            <select
                                id="custom_model"
                                name="custom_model"
                                value={formData.custom_model}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 bg-mocha-surface1 py-2 px-3 text-mocha-text ring-1 ring-inset ring-mocha-surface2 focus:ring-2 focus:ring-inset focus:ring-mocha-mauve sm:text-sm sm:leading-6"
                            >
                                {models.map(model => (
                                    <option key={model.id} value={model.id}>{model.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="gemini_api_key" className="block text-sm font-medium text-mocha-text mb-2">
                                Gemini API Key (Optional)
                            </label>
                            <input
                                type="password"
                                id="gemini_api_key"
                                name="gemini_api_key"
                                value={formData.gemini_api_key}
                                onChange={handleChange}
                                placeholder="Enter your own API key"
                                className="block w-full rounded-md border-0 bg-mocha-surface1 py-2 px-3 text-mocha-text ring-1 ring-inset ring-mocha-surface2 placeholder:text-mocha-overlay0 focus:ring-2 focus:ring-inset focus:ring-mocha-mauve sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="tutor_mode" className="block text-sm font-medium text-mocha-text mb-2">
                            Tutor Mode
                        </label>
                        <select
                            id="tutor_mode"
                            name="tutor_mode"
                            value={formData.tutor_mode}
                            onChange={handleChange}
                            className="block w-full rounded-md border-0 bg-mocha-surface1 py-2 px-3 text-mocha-text ring-1 ring-inset ring-mocha-surface2 focus:ring-2 focus:ring-inset focus:ring-mocha-mauve sm:text-sm sm:leading-6"
                        >
                            {tutorModes.map(mode => (
                                <option key={mode.id} value={mode.id}>{mode.label} - {mode.description}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="response_length" className="block text-sm font-medium text-mocha-text mb-2">
                            Response Length
                        </label>
                        <select
                            id="response_length"
                            name="response_length"
                            value={formData.response_length}
                            onChange={handleChange}
                            className="block w-full rounded-md border-0 bg-mocha-surface1 py-2 px-3 text-mocha-text ring-1 ring-inset ring-mocha-surface2 focus:ring-2 focus:ring-inset focus:ring-mocha-mauve sm:text-sm sm:leading-6"
                        >
                            {responseLengths.map(length => (
                                <option key={length.id} value={length.id}>{length.label} - {length.description}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="academic_level" className="block text-sm font-medium text-mocha-text mb-2">
                            Academic Level
                        </label>
                        <select
                            id="academic_level"
                            name="academic_level"
                            value={formData.academic_level}
                            onChange={handleChange}
                            className="block w-full rounded-md border-0 bg-mocha-surface1 py-2 px-3 text-mocha-text ring-1 ring-inset ring-mocha-surface2 focus:ring-2 focus:ring-inset focus:ring-mocha-mauve sm:text-sm sm:leading-6"
                        >
                            {academicLevels.map(level => (
                                <option key={level.id} value={level.id}>{level.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="major" className="block text-sm font-medium text-mocha-text mb-2">
                            Major / Field of Study
                        </label>
                        <input
                            type="text"
                            id="major"
                            name="major"
                            value={formData.major}
                            onChange={handleChange}
                            placeholder="e.g. Computer Science, Biology, Literature"
                            className="block w-full rounded-md border-0 bg-mocha-surface1 py-2 px-3 text-mocha-text ring-1 ring-inset ring-mocha-surface2 placeholder:text-mocha-overlay0 focus:ring-2 focus:ring-inset focus:ring-mocha-mauve sm:text-sm sm:leading-6"
                        />
                    </div>

                    <div>
                        <label htmlFor="about_me" className="block text-sm font-medium text-mocha-text mb-2">
                            About Me
                        </label>
                        <textarea
                            id="about_me"
                            name="about_me"
                            rows={4}
                            value={formData.about_me}
                            onChange={handleChange}
                            placeholder="Share your specific interests or learning goals..."
                            className="block w-full rounded-md border-0 bg-mocha-surface1 py-2 px-3 text-mocha-text ring-1 ring-inset ring-mocha-surface2 placeholder:text-mocha-overlay0 focus:ring-2 focus:ring-inset focus:ring-mocha-mauve sm:text-sm sm:leading-6"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-md bg-mocha-mauve px-4 py-2 text-sm font-semibold text-mocha-base hover:bg-mocha-pink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mocha-mauve disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
