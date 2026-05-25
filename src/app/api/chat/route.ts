import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import tutorModes from '@/config/tutorModes.json';
import responseLengths from '@/config/responseLengths.json';
import academicLevels from '@/config/academicLevels.json';

export async function POST(request: Request) {
    let chatId: string | undefined;

    try {
        const formData = await request.formData();
        const message = formData.get("message") as string;
        let chatId = formData.get("chatId") as string | undefined;
        const providedChatId = chatId;
        const skipUserSave = formData.get("skipUserSave") === "true";
        const file = formData.get("file") as File | null;

        if (!message && !file) {
            return new Response(JSON.stringify({ error: 'Message or file is required' }), { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Fetch user profile for personalization EARLY to use custom keys/models
        const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, tutor_mode, response_length, academic_level, major, about_me, custom_model')
            .eq('id', user.id)
            .single();

        let modelName = profile?.custom_model || process.env.GEMINI_AI_MODEL || "google/gemini-2.5-flash";
        if (!modelName.includes('/')) {
            modelName = `google/${modelName}`;
        }

        // Fetch history if this is an existing chat
        let validHistory: any[] = [];
        if (providedChatId) {
            const { data: previousMessages } = await supabase
                .from('messages')
                .select('role, content')
                .eq('chat_id', providedChatId)
                .order('created_at', { ascending: true });

            if (previousMessages) {
                let msgs = previousMessages;
                if (skipUserSave && msgs.length > 0) {
                    const lastMsg = msgs[msgs.length - 1];
                    if (lastMsg.role === 'user' && lastMsg.content === message) {
                        msgs = msgs.slice(0, -1);
                    }
                }

                // Clean history to ensure strict user -> model alternation (if still needed, though OpenRouter is more forgiving)
                for (const msg of msgs) {
                    if (validHistory.length === 0) {
                        if (msg.role === 'user') validHistory.push(msg);
                    } else {
                        const last = validHistory[validHistory.length - 1];
                        if (last.role !== msg.role) {
                            validHistory.push(msg);
                        } else {
                            validHistory[validHistory.length - 1] = msg;
                        }
                    }
                }
                
                if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
                    validHistory.pop();
                }
            }
        }

        // Create new chat if no ID provided
        if (!chatId) {
            let title = message ? message.substring(0, 30) + (message.length > 30 ? '...' : '') : 'Image upload';

            try {
                const proxyRes = await fetch('https://ai.hackclub.com/proxy/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.HACKCLUB_AI_API_KEY}` },
                    body: JSON.stringify({
                        model: "google/gemini-2.5-flash",
                        messages: [{ role: 'user', content: `Generate a short, descriptive, and engaging title (max 6 words) for a conversation starting with this message. It should capture the essence of the user's intent. Do not use quotes: ${message || "an image"}` }]
                    })
                });
                if (proxyRes.ok) {
                    const proxyData = await proxyRes.json();
                    title = proxyData.choices?.[0]?.message?.content?.trim() || title;
                }
            } catch (err) {
                console.error('Failed to generate title with proxy:', err);
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
                    content: message || "[Image attached]",
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
            if (major) parts.push(`The user's major/field of study is ${major}. Use relevant analogies.`);
            if (about_me) parts.push(`User info: ${about_me}`);

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

        const proxyMessages: any[] = [];
        if (systemInstruction) {
            proxyMessages.push({ role: 'system', content: systemInstruction });
        }
        for (const msg of validHistory) {
            proxyMessages.push({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.content || " ",
            });
        }

        let finalMessageContent: any = message || " ";
        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString('base64');
            finalMessageContent = [
                { type: "text", text: message || " " },
                { type: "image_url", image_url: { url: `data:${file.type};base64,${base64Data}` } }
            ];
        }

        proxyMessages.push({ role: 'user', content: finalMessageContent });

        const proxyResponse = await fetch('https://ai.hackclub.com/proxy/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.HACKCLUB_AI_API_KEY}` },
            body: JSON.stringify({
                model: modelName,
                messages: proxyMessages,
                stream: true,
            })
        });

        if (!proxyResponse.ok || !proxyResponse.body) {
            const errText = await proxyResponse.text().catch(() => 'unknown');
            console.error('Proxy failed:', errText);
            throw new Error(`Proxy error: ${errText}`);
        }

        const encoder = new TextEncoder();
        const proxyBody = proxyResponse.body;
        const stream = new ReadableStream({
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
        console.error('API Error:', error);

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
