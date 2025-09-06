import express from "express"
import dotenv from "dotenv"
dotenv.config();
import { messagingApi, middleware } from '@line/bot-sdk';
import type { WebhookEvent } from '@line/bot-sdk';
import { handleEvent } from "./handleEvent.ts";
import mongoose from "mongoose";
import * as fs from 'fs';

const logStream = fs.createWriteStream('app.log', { flags: 'a' });

const originalLog = console.log;
console.log = function (...args) {
  const msg = args.map(String).join(' ');
  logStream.write(msg + '\n');
  originalLog.apply(console, args);
};

const { MessagingApiClient } = messagingApi;

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/linebot";
mongoose.connect(uri).then(() => {
    console.log("Connected to MongoDB");
});

const app = express();

const config = {
    channelSecret: process.env.CHANNEL_SECRET || '',
}

const client = new MessagingApiClient({
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
});

app.post('/', middleware(config), (req, res) => {
    Promise
    .all(req.body.events.map((event: WebhookEvent) => handleEvent(event, client)))
    .then((result) => res.json(result))
    .catch((err) => {
        console.error(err);
        res.status(500).end();
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});