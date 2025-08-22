import { messagingApi } from '@line/bot-sdk';
const { MessagingApiClient } = messagingApi;
import { Schema, model } from "mongoose";
import { createReply } from "./createReply.ts";

const messageSchema = new Schema({
    userId: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});

const Message = model("Message", messageSchema);

export async function handleEvent(event: any, client: InstanceType<typeof MessagingApiClient>) {
    try {
        if (event.type !== "message" || event.message.type !== "text") {
            return Promise.resolve(null);
        }
        const userId: string = event.source.userId;
        const text: string = event.message.text;

        const messageDoc = new Message({ userId, message: text });
        await messageDoc.save();

        const messages = await Message.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5);

        const history = messages.reverse().map((msg) => msg.message);

        if (!history || history.length === 0) {
            return Promise.resolve(null);
        }

        console.log("User message history:", history);
        console.log("Current user message:", text);

        const gptReply = await createReply(history, text);

        if (event.source.type === "group" || event.source.type === "room") {
            if (Math.random() < 0.6) {
                return;
            }
        }

        console.log("GPT reply:", gptReply);

        return client.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: gptReply }],
        });

    } catch (error) {
        console.error("handleEvent error:", error);

        if (event.replyToken) {
            return client.replyMessage({
                replyToken: event.replyToken,
                messages: [{ type: 'text', text: `エラーが発生しました。もう一度お試しください。` }],
            });
        }
        return Promise.resolve(null);
    }
}