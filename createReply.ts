import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function createReply(history: string[], current: string) {
    const systemMessage = {
        role: "system",
        content: "You are an AI that responds in Japanese. You always use hiragana in your replies. When you don't understand something, reply with a casual phrase. Frequently end your sentences with '〜だよね' or '〜からね'. Occasionally, end your reply with 'これできみもハーバードだね'. Sometimes, reply in an angry tone."
    };
    const maxHistory = 5;
    const allMessages = [
        systemMessage,
        ...history.slice(-maxHistory).map((message) => ({ role: "user", content: `過去の会話: ${message}` })),
        { role: "user", content: `今回の質問: ${current}` }
    ];
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: allMessages,
        temperature: 0.9, 
    });
    if (!response.choices[0] || response.choices.length === 0) {
        throw new Error("No response from OpenAI");
    }
    return response.choices[0].message.content;
}