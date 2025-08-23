import { messagingApi} from '@line/bot-sdk';
import { createReply } from "./createReply.ts";
import { UserMessage, GroupMessage } from './models/message.ts';

const { MessagingApiClient } = messagingApi;


let power: boolean = true;

const saruReplies: string[] = [
    "うきうき", "キーキー", "ウキッ", "ウキキー！", "ウホッ", "ウキウキ", "ウホホホ",
];

const getMessageHistory = async (model: any, id: string, limit: number) => {
    const messages = await model.find({ [model.modelName === "UserMessage" ? "userId" : "groupId"]: id })
        .sort({ createdAt: -1 })
        .limit(limit);
    return messages.reverse().flatMap((msg: any) => typeof msg.message === 'string' ? msg.message : []);
}

export async function handleEvent(event: any, client: InstanceType<typeof MessagingApiClient>) {
    try {
        if (event.type !== "message" || event.message.type !== "text") {
            return Promise.resolve(null);
        }

        const messageLimit = 5;
        const text: string = event.message.text;
        const userId: string = event.source.userId;

        if (text === "toggle") {
            const reply = togglePower(event);
            return client.replyMessage({
                replyToken: event.replyToken,
                messages: [{ type: 'text', text: reply }],
            });
        }

        if (!power) {
            return Promise.resolve(null);
        }

        let history: string[] = [];
        if (event.source.type === "user") {
            await new UserMessage({ userId, message: text }).save();
            history = await getMessageHistory(UserMessage, userId, messageLimit);
        } else if (event.source.type === "group" || event.source.type === "room") {
            const groupId: string = event.source.groupId || event.source.roomId;
            await new GroupMessage({ groupId, message: text }).save();
            history = await getMessageHistory(GroupMessage, groupId, messageLimit);
        }

        if (!history.length) return Promise.resolve(null);

        const gptReply = await createReply(history, text);
        if (!gptReply || !probabilitySolver(event)) {
            return Promise.resolve(null);
        }

        console.log("GPT reply:", gptReply);
        return client.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: gptReply }],
        });

    } catch (error) {
        return handleError(event, error, client);
    }
}

const handleError = (event: any, error: any, client: InstanceType<typeof MessagingApiClient>) => {
    console.error("handleEvent error:", error);
    if (event.replyToken) {
        return client.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: `エラーが発生しました。もう一度お試しください。` }],
        });
    }
    return Promise.resolve(null);
}

const probabilitySolver = (event: any): boolean => {
    if (event.message?.quotedMessageId || event.message?.mention) {
        return true;
    }
    if (event.source.type === "group" || event.source.type === "room") {
        return Math.random() < 0.25; 
    }
    return true;
}

const togglePower = (event: any): string => {
    if (event.source.userId !== process.env.ADMIN) return power ? "Power is ON" : "Power is OFF";
    power = !power;
    return power ? "Power is ON" : "Power is OFF"; 
}
