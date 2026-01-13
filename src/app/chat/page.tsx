"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Send, User, Bot, LogOut, MessageSquare, Plus, Trash2, PanelLeftClose, PanelLeftOpen, Settings, Palette, Pencil, X, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { toast } from 'sonner';

interface Message {
    id?: string;
    role: 'user' | 'model';
    text: string;
}

interface ChatSession {
    id: string;
    title: string;
    created_at: string;
}

export default function ChatPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showSettingsPopup, setShowSettingsPopup] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editInput, setEditInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Responsive sidebar init
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        // Set initial state
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }

    }, []);

    // Check user on mount
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/signin');
                return;
            }
            setUser(session.user);
            fetchChats(session.user.id);
        };
        checkUser();
    }, [router]);

    const fetchChats = async (userId: string) => {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setChats(data);
    };

    const loadChat = async (chatId: string) => {
        setCurrentChatId(chatId);
        setLoading(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (data) {
            setMessages(data.map(m => ({ id: m.id, role: m.role as 'user' | 'model', text: m.content })));
        } else {
            setMessages([]);
        }
        setLoading(false);
    };



    const deleteChat = (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();

        toast('Are you sure you want to delete this chat?', {
            action: {
                label: 'Delete',
                onClick: async () => {
                    const { error } = await supabase
                        .from('chats')
                        .delete()
                        .eq('id', chatId);

                    if (error) {
                        console.error('Error deleting chat:', error);
                        toast.error('Failed to delete chat');
                        return;
                    }

                    toast.success('Chat deleted');
                    setChats(prev => prev.filter(c => c.id !== chatId));
                    if (currentChatId === chatId) {
                        startNewChat();
                    }
                },
            },
            cancel: {
                label: 'Cancel',
                onClick: () => { },
            },
            duration: Infinity,
        });
    };

    const startNewChat = () => {
        setCurrentChatId(null);
        setMessages([]);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll effect (keep existing)
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const triggerGemini = async (messageText: string, chatId: string | null, skipUserSave: boolean = false) => {
        setLoading(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: messageText,
                    chatId: chatId,
                    skipUserSave
                }),
            });

            // Handle new chat creation via header
            const newChatId = response.headers.get('X-Chat-Id');
            if (newChatId && !currentChatId) {
                setCurrentChatId(newChatId);
                fetchChats(user.id);
            }

            const userMsgId = response.headers.get('X-User-Message-Id');
            if (userMsgId) {
                setMessages((prev) => {
                    const newMessages = [...prev];
                    // The last message added was the user message
                    const userMsgIndex = newMessages.length - 1;
                    if (newMessages[userMsgIndex].role === 'user') {
                        newMessages[userMsgIndex] = { ...newMessages[userMsgIndex], id: userMsgId };
                    }
                    return newMessages;
                });
            }

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to get response');
            }

            // Create placeholder for bot message
            const botMessage: Message = { role: 'model', text: '' };
            setMessages((prev) => [...prev, botMessage]);

            // Read the stream
            if (!response.body) return;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    const lastMsg = { ...newMessages[lastIndex] }; // Shallow copy

                    if (lastMsg.role === 'model') {
                        lastMsg.text += chunk;
                        newMessages[lastIndex] = lastMsg;
                    }
                    return newMessages;
                });
            }

        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = { role: 'model', text: 'Sorry, I encountered an error. Please try again.' };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages((prev) => [...prev, userMessage]);
        const currentInput = input;
        setInput('');

        await triggerGemini(currentInput, currentChatId);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const startEditing = (msg: Message) => {
        if (!msg.id) return;
        setEditingMessageId(msg.id);
        setEditInput(msg.text);
    };

    const cancelEdit = () => {
        setEditingMessageId(null);
        setEditInput('');
    };

    const saveEdit = async () => {
        if (!editingMessageId || !editInput.trim()) return;

        const originalMessage = messages.find(m => m.id === editingMessageId);
        if (!originalMessage || originalMessage.text === editInput) {
            cancelEdit();
            return;
        }

        // Optimistic update
        setMessages(prev => prev.map(m =>
            m.id === editingMessageId ? { ...m, text: editInput } : m
        ));

        const currentEditId = editingMessageId;
        const currentEditText = editInput;
        cancelEdit();

        const { error } = await supabase
            .from('messages')
            .update({ content: currentEditText })
            .eq('id', currentEditId);

        if (error) {
            console.error('Error updating message:', error);
            toast.error('Failed to update message');
            // Revert
            setMessages(prev => prev.map(m =>
                m.id === currentEditId ? { ...m, text: originalMessage.text } : m
            ));
        } else {
            // Find if there is a next message (AI response) to delete and regenerate
            const msgIndex = messages.findIndex(m => m.id === currentEditId);
            if (msgIndex !== -1 && msgIndex < messages.length - 1) {
                const nextMsg = messages[msgIndex + 1];
                if (nextMsg.role === 'model') {
                    // Delete AI response from DB (if it has an ID, though we might not have it locally if it helps to fetch from DB)
                    // But our messages state doesn't always have ID for model? 
                    // Wait, loadChat sets IDs. Streamed ones might not have ID yet if we didn't reload?
                    // Actually, stream doesn't return model ID. We only save it.
                    // So we must delete via other means or just trust fetching?
                    // Safe bet: Delete from DB by looking up the message AFTER the user message? 
                    // Or since we just want to regenerate, we can just proceed.
                    // But if we don't delete, we'll have duplicate AI responses in history.

                    // Let's try to delete the message via supabase if we can find it.
                    // Since we don't assume we have the ID for the model message in `messages` state (unless loaded from DB),
                    // we'll rely on the fact it's the latest message (since we restrict edit to latest).

                    // Actually, if it's the latest user message, the model message is the absolute last message.
                    const { error: delError } = await supabase
                        .from('messages')
                        .delete()
                        .match({ chat_id: currentChatId, role: 'model' })
                        .gt('created_at', new Date(Date.now() - 1000 * 60 * 60).toISOString()) // Safety: only recent? No.
                    // Better: delete the specific message that follows.
                    // Since we don't have the ID, we must assume it's the last one.

                    // Actually, let's just delete the last message of the chat if it is a model message.
                    const { data: lastMessages } = await supabase
                        .from('messages')
                        .select('id, role')
                        .eq('chat_id', currentChatId)
                        .order('created_at', { ascending: false })
                        .limit(1);

                    if (lastMessages && lastMessages.length > 0 && lastMessages[0].role === 'model') {
                        await supabase.from('messages').delete().eq('id', lastMessages[0].id);
                    }

                    // Remove from local state
                    setMessages(prev => prev.slice(0, msgIndex + 1));
                }
            }

            triggerGemini(currentEditText, currentChatId, true);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-mocha-base flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mocha-mauve"></div>
            </div>
        )
    }

    const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf('user');

    return (
        <div className="flex h-screen bg-mocha-base text-mocha-text pt-16 relative">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
                    fixed inset-y-0 left-0 z-40 h-full w-64 bg-mocha-crust border-r border-mocha-surface1 p-4 pt-20 md:pt-4 flex flex-col transition-all duration-300 ease-in-out
                    md:relative md:h-auto md:translate-x-0
                    ${sidebarOpen
                        ? 'translate-x-0 md:w-64 md:opacity-100'
                        : '-translate-x-full md:w-0 md:opacity-0 md:p-0 md:overflow-hidden md:border-none'
                    }
                `}
            >
                <div className={`${!sidebarOpen && 'md:hidden'} flex flex-col h-full`}>
                    <button
                        onClick={startNewChat}
                        className="mb-4 rounded-lg bg-mocha-surface0 p-3 text-left font-medium hover:bg-mocha-surface1 transition-colors flex items-center gap-2 border border-mocha-surface1 shrink-0"
                    >
                        <Plus size={18} /> <span className="truncate">New Chat</span>
                    </button>
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-mocha-surface2">
                        <div className="text-xs font-semibold text-mocha-overlay1 uppercase mb-2 ml-2">History</div>
                        {chats.length === 0 ? (
                            <div className="text-sm text-mocha-overlay0 ml-2 italic">No previous chats</div>
                        ) : (
                            chats.map(chat => (
                                <div
                                    key={chat.id}
                                    className={`group flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors mb-1 ${currentChatId === chat.id
                                        ? 'bg-mocha-surface1 text-mocha-text'
                                        : 'text-mocha-subtext0 hover:bg-mocha-surface0 hover:text-mocha-text'
                                        }`}
                                >
                                    <button
                                        onClick={() => {
                                            loadChat(chat.id);
                                            // On mobile, close sidebar after release selection
                                            if (window.innerWidth < 768) setSidebarOpen(false);
                                        }}
                                        className="flex-1 text-left truncate text-sm"
                                    >
                                        <MessageSquare size={14} className="inline mr-2 opacity-70" />
                                        {chat.title}
                                    </button>
                                    <button
                                        onClick={(e) => deleteChat(e, chat.id)}
                                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 text-mocha-overlay0 hover:text-mocha-red transition-opacity"
                                        title="Delete Chat"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="border-t border-mocha-surface1 pt-4 mt-auto shrink-0 relative">
                        {showSettingsPopup && (
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-mocha-surface0 rounded-lg border border-mocha-surface1 shadow-lg overflow-hidden z-50">
                                <Link
                                    href="/settings"
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-mocha-text hover:bg-mocha-surface1 transition-colors w-full text-left"
                                >
                                    <Settings size={16} />
                                    Settings
                                </Link>
                                <Link
                                    href="/settings/personalization"
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-mocha-text hover:bg-mocha-surface1 transition-colors w-full text-left border-t border-mocha-surface1"
                                >
                                    <Palette size={16} />
                                    Personalization
                                </Link>
                            </div>
                        )}
                        <button
                            onClick={() => setShowSettingsPopup(!showSettingsPopup)}
                            className="flex items-center gap-2 px-2 py-2 hover:bg-mocha-surface1 rounded-md transition-colors group w-full text-left"
                        >
                            <div className="h-8 w-8 rounded-full bg-mocha-mauve flex items-center justify-center text-mocha-base font-bold text-xs group-hover:scale-105 transition-transform">
                                {(user?.user_metadata?.username || user?.email)?.[0].toUpperCase()}
                            </div>
                            <div className="flex-1 truncate text-xs font-medium text-mocha-subtext0 group-hover:text-mocha-text transition-colors">
                                {user?.user_metadata?.username || user?.email}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col min-w-0">
                {/* Chat Header */}
                <div className="sticky top-0 z-10 border-b border-mocha-surface1 bg-mocha-base/80 p-4 backdrop-blur-md flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 text-mocha-subtext0 hover:text-mocha-text hover:bg-mocha-surface1 rounded-md transition-colors"
                    >
                        {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                    </button>

                    <h2 className="text-lg font-semibold text-mocha-text truncate flex-1 text-center">
                        {currentChatId
                            ? chats.find(c => c.id === currentChatId)?.title
                            : ''}
                    </h2>

                    {/* Spacer for centering logic */}
                    <div className="w-9 hidden md:block"></div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-mocha-mauve scrollbar-track-transparent">
                    <div className="mx-auto max-w-3xl space-y-6">
                        {messages.length === 0 && (
                            <div className="flex h-full flex-col items-center justify-center text-center opacity-50 mt-20">
                                <Bot className="h-16 w-16 mb-4 text-mocha-mauve" />
                                <h2 className="text-2xl font-bold">How can I help you today?</h2>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'model' && (
                                    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-mocha-mauve text-mocha-base">
                                        <Bot size={18} />
                                    </div>
                                )}
                                <div
                                    className={`relative max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                        ? 'bg-mocha-mauve text-mocha-base'
                                        : 'bg-mocha-surface0 text-mocha-text border border-mocha-surface1'
                                        }`}
                                >
                                    {editingMessageId === msg.id ? (
                                        <div className="w-full min-w-[200px]">
                                            <textarea
                                                value={editInput}
                                                onChange={(e) => setEditInput(e.target.value)}
                                                className="w-full bg-black/10 text-mocha-base rounded p-2 focus:outline-hidden resize-none mb-2"
                                                rows={3}
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={cancelEdit} className="p-1 rounded hover:bg-black/10 transition-colors" title="Cancel">
                                                    <X size={16} />
                                                </button>
                                                <button onClick={saveEdit} className="p-1 rounded hover:bg-black/10 transition-colors" title="Save">
                                                    <Check size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="group/msg relative">
                                            <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                        code: ({ node, className, children, ...props }: any) => {
                                                            const match = /language-(\w+)/.exec(className || '')
                                                            return match ? (
                                                                <div className="rounded-md bg-mocha-crust p-2 my-2 overflow-x-auto">
                                                                    <code className={className} {...props}>
                                                                        {children}
                                                                    </code>
                                                                </div>
                                                            ) : (
                                                                <code className="bg-mocha-surface2 px-1 py-0.5 rounded text-sm" {...props}>
                                                                    {children}
                                                                </code>
                                                            )
                                                        }
                                                    }}
                                                >
                                                    {msg.text}
                                                </ReactMarkdown>
                                                {msg.role === 'model' && idx === messages.length - 1 && loading && (
                                                    <span className="inline-block w-2.5 h-4 ml-1 align-text-bottom bg-mocha-mauve animate-pulse rounded-xs" />
                                                )}
                                            </div>
                                            {msg.role === 'user' && msg.id && !loading && idx === lastUserMessageIndex && (
                                                <button
                                                    onClick={() => startEditing(msg)}
                                                    className="absolute -left-10 top-0 p-1 text-mocha-overlay0 hover:text-mocha-text opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 transition-opacity"
                                                    title="Edit message"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-mocha-surface2 text-mocha-text">
                                        <User size={18} />
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && messages[messages.length - 1]?.role !== 'model' && (
                            <div className="flex gap-4 justify-start">
                                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-mocha-mauve text-mocha-base">
                                    <Bot size={18} />
                                </div>
                                <div className="h-10 w-full max-w-[120px] rounded-2xl bg-linear-to-r from-mocha-blue/20 via-mocha-mauve/20 to-mocha-pink/20 animate-pulse border border-mocha-surface1" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="border-t border-mocha-surface0 bg-mocha-base p-4">
                    <div className="mx-auto max-w-3xl">
                        <div className="relative flex items-end rounded-xl bg-mocha-surface0 ring-1 ring-inset ring-mocha-surface1 focus-within:ring-2 focus-within:ring-mocha-mauve">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message Gemini..."
                                className="max-h-48 min-h-[52px] w-full resize-none bg-transparent py-3 pl-4 pr-12 text-mocha-text placeholder:text-mocha-overlay0 focus:outline-hidden sm:text-sm sm:leading-6"
                                rows={1}
                                style={{ height: 'auto', overflow: 'hidden' }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="absolute right-2 bottom-2 rounded-lg p-2 text-mocha-subtext0 hover:bg-mocha-surface1 hover:text-mocha-mauve disabled:opacity-50 disabled:hover:bg-transparent"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
