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
        const { message, chatId: providedChatId } = body;
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
                historyForGemini = previousMessages.map(msg => ({
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
                console.error('Failed to generate title:', err);
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

        // Save User Message
        const { error: userMsgError } = await supabase
            .from('messages')
            .insert({
                chat_id: chatId,
                role: 'user',
                content: message,
            });

        if (userMsgError) {
            console.error('Error saving user message:', userMsgError);
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

        const result = await chat.sendMessageStream(message);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                let fullText = '';
                try {
                    for await (const chunk of result.stream) {
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
                } catch (error) {
                    console.error('Streaming error:', error);
                    controller.error(error);
                }
            }
        });

        const responseHeaders: Record<string, string> = {
            'Content-Type': 'text/plain; charset=utf-8',
        };
        if (chatId) {
            responseHeaders['X-Chat-Id'] = chatId;
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


