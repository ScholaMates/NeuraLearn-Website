"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, User, Shield, Smartphone, Mail, Key, Eye, EyeOff, LogOut } from 'lucide-react';

type Tab = 'general' | 'security';

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    // Form States
    const [username, setUsername] = useState('');
    const [deviceId, setDeviceId] = useState('');
    const [email, setEmail] = useState('');

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Status / Feedback
    const [saving, setSaving] = useState(false);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error('Error signing out');
        } else {
            toast.success('Signed out successfully');
            router.refresh();
            router.push('/signin');
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/signin');
            return;
        }
        setUser(user);
        setUsername(user.user_metadata?.username || '');
        setEmail(user.email || '');

        // Fetch profile data for Device ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('device_id')
            .eq('id', user.id)
            .single();

        if (profile) {
            setDeviceId(profile.device_id || '');
        }
        setLoading(false);
    };

    const handleUpdateGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // 1. Handle Device ID Change if needed
            if (deviceId) {
                const response = await fetch('/api/settings/device', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deviceId }),
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data.message !== 'Device ID is already set to this value') {
                        throw new Error(data.error || 'Failed to update Device ID');
                    }
                }
            }

            // 2. Update Username
            const { error: authError } = await supabase.auth.updateUser({
                data: { username: username }
            });

            if (authError) throw authError;

            // Update Profiles Table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    username: username,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            toast.success('Profile updated successfully!');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase.auth.updateUser({ email: email });
            if (error) throw error;
            toast.success('Confirmation email sent to new address!');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            setSaving(false);
            return;
        }

        try {
            // Verify current password by signing in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (signInError) {
                throw new Error('Incorrect current password');
            }

            // Update Password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            // Sync password to profiles table
            await supabase
                .from('profiles')
                .update({
                    password: newPassword,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            toast.success('Password updated successfully!');
            // Clear fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
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
        <div className="min-h-screen bg-mocha-base text-mocha-text pt-20 px-4 pb-12 font-space">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/chat" className="p-2 -ml-2 rounded-full hover:bg-mocha-surface1 text-mocha-subtext0 hover:text-mocha-text transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Settings</h1>
                        <p className="text-mocha-subtext0 text-sm">Manage your account and preferences.</p>
                    </div>
                </div>

                <div className="flex gap-6 flex-col lg:flex-row">
                    {/* Sidebar / Tabs */}
                    <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general'
                                ? 'bg-mocha-surface2 text-mocha-text'
                                : 'text-mocha-subtext0 hover:bg-mocha-surface0 hover:text-mocha-text'
                                }`}
                        >
                            <User size={18} />
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security'
                                ? 'bg-mocha-surface2 text-mocha-text'
                                : 'text-mocha-subtext0 hover:bg-mocha-surface0 hover:text-mocha-text'
                                }`}
                        >
                            <Shield size={18} />
                            Security
                        </button>

                        <div className="border-t border-mocha-surface1 my-2"></div>

                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-mocha-red hover:bg-mocha-red/10 transition-colors text-left"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-mocha-surface0 rounded-xl border border-mocha-surface1 p-6 md:p-8 shadow-sm h-fit">


                        {activeTab === 'general' && (
                            <form onSubmit={handleUpdateGeneral} className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">General Information</h2>
                                    <div className="grid gap-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Username</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-2.5 text-mocha-overlay0" size={18} />
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="block w-full rounded-md border-0 bg-mocha-surface1 py-2.5 pl-10 pr-3 text-mocha-text ring-1 ring-inset ring-mocha-surface2 focus:ring-2 focus:ring-mocha-mauve sm:text-sm"
                                                    placeholder="Username"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Device ID</label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-3 top-2.5 text-mocha-overlay0" size={18} />
                                                <input
                                                    type="text"
                                                    value={deviceId}
                                                    onChange={(e) => setDeviceId(e.target.value)}
                                                    className="block w-full rounded-md border-0 bg-mocha-surface1 py-2.5 pl-10 pr-3 text-mocha-text ring-1 ring-inset ring-mocha-surface2 focus:ring-2 focus:ring-mocha-mauve sm:text-sm"
                                                    placeholder="Device ID"
                                                />
                                            </div>
                                            <p className="mt-2 text-xs text-mocha-subtext0">
                                                Used to link your physical devices constraints.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-mocha-surface1 pt-6 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-mocha-mauve text-mocha-base px-6 py-2.5 rounded-lg font-semibold hover:bg-mocha-pink transition-colors disabled:opacity-50"
                                    >
                                        {saving && <Loader2 className="animate-spin" size={16} />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8">
                                {/* Email Update Section */}
                                <form onSubmit={handleUpdateEmail}>
                                    <h2 className="text-xl font-semibold mb-4">Email Address</h2>
                                    <div className="grid gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Current Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-2.5 text-mocha-overlay0" size={18} />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="block w-full rounded-md border-0 bg-mocha-surface1 py-2.5 pl-10 pr-3 text-mocha-text ring-1 ring-inset ring-mocha-surface2 focus:ring-2 focus:ring-mocha-mauve sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={saving || email === user?.email}
                                                className="bg-mocha-surface2 text-mocha-text px-4 py-2 rounded-lg text-sm font-medium hover:bg-mocha-overlay0 transition-colors disabled:opacity-50"
                                            >
                                                Update Email
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <div className="border-t border-mocha-surface1"></div>

                                {/* Password Update Section */}
                                <form onSubmit={handleUpdatePassword}>
                                    <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Current Password</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-2.5 text-mocha-overlay0" size={18} />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="block w-full rounded-md border-0 bg-mocha-surface1 py-2.5 pl-10 pr-10 text-mocha-text ring-1 ring-inset ring-mocha-surface2 focus:ring-2 focus:ring-mocha-mauve sm:text-sm"
                                                    placeholder="Enter current password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-2.5 text-mocha-subtext0 hover:text-mocha-text"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">New Password</label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="block w-full rounded-md border-0 bg-mocha-surface1 py-2.5 px-3 text-mocha-text ring-1 ring-inset ring-mocha-surface2 focus:ring-2 focus:ring-mocha-mauve sm:text-sm"
                                                    placeholder="New password"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="block w-full rounded-md border-0 bg-mocha-surface1 py-2.5 px-3 text-mocha-text ring-1 ring-inset ring-mocha-surface2 focus:ring-2 focus:ring-mocha-mauve sm:text-sm"
                                                    placeholder="Confirm new password"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex items-center gap-2 bg-mocha-red text-mocha-base px-6 py-2.5 rounded-lg font-semibold hover:bg-red-400 transition-colors disabled:opacity-50"
                                        >
                                            {saving && <Loader2 className="animate-spin" size={16} />}
                                            Change Password
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
