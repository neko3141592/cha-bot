import { Schema, model } from "mongoose";

const UserMessageSchema = new Schema({
    userId: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});

const GroupMessageSchema = new Schema({
    groupId: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});

export const UserMessage = model("UserMessage", UserMessageSchema);
export const GroupMessage = model("GroupMessage", GroupMessageSchema);