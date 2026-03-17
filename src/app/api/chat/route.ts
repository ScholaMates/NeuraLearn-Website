import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import tutorModes from '@/config/tutorModes.json';
import responseLengths from '@/config/responseLengths.json';
import academicLevels from '@/config/academicLevels.json';

const API = process.env.GEMINI_API_KEY!;

export async function POST(request: Request) {
    let chatId: string | undefined;

    try {
        const body = await request.json();
        const { message, chatId: providedChatId, skipUserSave } = body;
        chatId = providedChatId;

        if (!message) {
            return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Fetch user profile for personalization EARLY to use custom keys/models
        const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, tutor_mode, response_length, academic_level, major, about_me, custom_model, gemini_api_key')
            .eq('id', user.id)
            .single();

        const apiKey = profile?.gemini_api_key || process.env.GEMINI_API_KEY!;
        const modelName = profile?.custom_model || process.env.GEMINI_AI_MODEL!;

        const genAI = new GoogleGenerativeAI(apiKey);

        // Fetch history if this is an existing chat
        let historyForGemini: { role: string; parts: { text: string }[] }[] = [];
        if (providedChatId) {
            const { data: previousMessages } = await supabase
                .from('messages')
                .select('role, content')
                .eq('chat_id', providedChatId)
                .order('created_at', { ascending: true });

            if (previousMessages) {
                let msgs = previousMessages;
                // If we are skipping user save, it means the message is already in DB (as the last message).
                // We need to remove it from history so we don't duplicate it in the prompt context.
                if (skipUserSave && msgs.length > 0) {
                    const lastMsg = msgs[msgs.length - 1];
                    if (lastMsg.role === 'user' && lastMsg.content === message) {
                        msgs = msgs.slice(0, -1);
                    }
                }

                historyForGemini = msgs.map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.content }],
                }));
            }
        }

        // Create new chat if no ID provided
        if (!chatId) {
            let title = message.substring(0, 30) + (message.length > 30 ? '...' : '');

            try {
                // Generate a short title using Gemini 
                const titleModel = genAI.getGenerativeModel({ model: modelName });
                const titleResult = await titleModel.generateContent(`Generate a short, descriptive, and engaging title (max 6 words) for a conversation starting with this message. It should capture the essence of the user's intent. Do not use quotes: ${message}`);
                const titleResponse = await titleResult.response;
                title = titleResponse.text().trim();
            } catch (err) {
                console.error('Failed to generate title with Gemini, trying fallback:', err);
                // Fallback to hackclub proxy for title generation
                try {
                    const proxyRes = await fetch('https://ai.hackclub.com/proxy/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.HACKCLUB_AI_API_KEY}` },
                        body: JSON.stringify({
                            messages: [{ role: 'user', content: `Generate a short, descriptive, and engaging title (max 6 words) for a conversation starting with this message. It should capture the essence of the user's intent. Do not use quotes: ${message}` }]
                        })
                    });
                    if (proxyRes.ok) {
                        const proxyData = await proxyRes.json();
                        title = proxyData.choices?.[0]?.message?.content?.trim() || title;
                    }
                } catch (fallbackErr) {
                    console.error('Fallback title generation also failed:', fallbackErr);
                }
            }

            const { data: newChat, error: chatError } = await supabase
                .from('chats')
                .insert({
                    user_id: user.id,
                    title: title,
                })
                .select()
                .single();

            if (chatError || !newChat) {
                console.error('Error creating chat:', chatError);
                return new Response(JSON.stringify({ error: 'Failed to create chat session' }), { status: 500 });
            }
            chatId = newChat.id;
        }

        // Save User Message (only if not skipped)
        let userMsg: any = null;
        if (!skipUserSave) {
            const { data, error: userMsgError } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    role: 'user',
                    content: message,
                })
                .select()
                .single();

            userMsg = data;

            if (userMsgError) {
                console.error('Error saving user message:', userMsgError);
            }
        }

        let systemInstruction = "You are a helpful AI assistant. Use LaTeX for mathematical expressions. Wrap inline math in single dollar signs ($) and block math in double dollar signs ($$).";

        if (profile) {
            const { nickname, tutor_mode, response_length, academic_level, major, about_me } = profile;

            const parts = [];

            if (nickname) parts.push(`The user's nickname is ${nickname}.`);

            // Apply Context from Profile
            if (major) parts.push(`The user's major/field of study is ${major}. Use relevant analogies.`);
            if (about_me) parts.push(`User info: ${about_me}`);

            // Apply Configuration Lookups
            const modeConfig = tutorModes.find(m => m.id === tutor_mode);
            if (modeConfig) parts.push(modeConfig.prompt);

            const lengthConfig = responseLengths.find(l => l.id === response_length);
            if (lengthConfig) parts.push(lengthConfig.prompt);

            const levelConfig = academicLevels.find(l => l.id === academic_level);
            if (levelConfig) parts.push(levelConfig.prompt);

            if (parts.length > 0) {
                systemInstruction += " " + parts.join(" ");
            }
        }

        const encoder = new TextEncoder();
        let stream: ReadableStream;

        let geminiResult: any = null;
        let useProxy = false;

        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemInstruction
            });

            const chat = model.startChat({
                history: historyForGemini,
                generationConfig: {
                    maxOutputTokens: 2000,
                },
            });

            geminiResult = await chat.sendMessageStream(message);
        } catch (geminiInitError) {
            console.warn('Gemini API failed, falling back to hackclub proxy:', geminiInitError);
            useProxy = true;
        }

        if (!useProxy && geminiResult) {
            stream = new ReadableStream({
                async start(controller) {
                    let fullText = '';
                    try {
                        for await (const chunk of geminiResult.stream) {
                            const chunkText = chunk.text();
                            fullText += chunkText;
                            controller.enqueue(encoder.encode(chunkText));
                        }

                        // Save Model Message to DB
                        await supabase
                            .from('messages')
                            .insert({
                                chat_id: chatId,
                                role: 'model',
                                content: fullText,
                            });

                        controller.close();
                    } catch (streamError) {
                        console.warn('Gemini streaming error, trying proxy fallback:', streamError);
                        controller.error(streamError);
                    }
                }
            });
        } else {
            // Fallback: ai.hackclub.com with SSE streaming
            const proxyMessages: { role: string; content: string }[] = [];
            if (systemInstruction) {
                proxyMessages.push({ role: 'system', content: systemInstruction });
            }
            for (const msg of historyForGemini) {
                proxyMessages.push({
                    role: msg.role === 'model' ? 'assistant' : 'user',
                    content: msg.parts[0].text,
                });
            }
            proxyMessages.push({ role: 'user', content: message });

            const proxyResponse = await fetch('https://ai.hackclub.com/proxy/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.HACKCLUB_AI_API_KEY}` },
                body: JSON.stringify({
                    messages: proxyMessages,
                    stream: true,
                })
            });

            if (!proxyResponse.ok || !proxyResponse.body) {
                const errText = await proxyResponse.text().catch(() => 'unknown');
                console.error('Proxy fallback failed:', errText);
                throw new Error('Both Gemini and fallback proxy failed');
            }

            const proxyBody = proxyResponse.body;
            stream = new ReadableStream({
                async start(controller) {
                    let fullText = '';
                    const reader = proxyBody.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            buffer += decoder.decode(value, { stream: true });
                            const lines = buffer.split('\n');
                            buffer = lines.pop() ?? '';
                            for (const line of lines) {
                                const trimmed = line.trim();
                                if (!trimmed.startsWith('data:')) continue;
                                const data = trimmed.slice(5).trim();
                                if (data === '[DONE]') continue;
                                try {
                                    const parsed = JSON.parse(data);
                                    const delta = parsed.choices?.[0]?.delta?.content;
                                    if (delta) {
                                        fullText += delta;
                                        controller.enqueue(encoder.encode(delta));
                                    }
                                } catch { /* ignore malformed SSE lines */ }
                            }
                        }

                        // Save Model Message to DB
                        await supabase
                            .from('messages')
                            .insert({
                                chat_id: chatId,
                                role: 'model',
                                content: fullText,
                            });

                        controller.close();
                    } catch (proxyStreamError) {
                        console.error('Proxy streaming error:', proxyStreamError);
                        controller.error(proxyStreamError);
                    }
                }
            });
        }

        const responseHeaders: Record<string, string> = {
            'Content-Type': 'text/plain; charset=utf-8',
        };
        if (chatId) {
            responseHeaders['X-Chat-Id'] = chatId;
        }
        if (userMsg?.id) {
            responseHeaders['X-User-Message-Id'] = userMsg.id;
        }

        return new Response(stream, {
            headers: responseHeaders
        });

    } catch (error) {
        console.error('Gemini API Error:', error);

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (chatId) {
            headers['X-Chat-Id'] = chatId;
        }

        return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
            status: 500,
            headers
        });
    }
}


