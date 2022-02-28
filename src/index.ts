import { delay } from "./delay";

import dotenv from "dotenv";
import { ChatDeleteResponse, WebClient } from "@slack/web-api";
import { Message } from "@slack/web-api/dist/response/ConversationsHistoryResponse";

const getEnv: () => { token: string; channels: string[] } = () => {
  dotenv.config();
  // Read a token from the environment variables
  if (process.env.SLACK_TOKEN === undefined) {
    throw new Error("Please set process.env.SLACK_TOKEN (User OAuth Token)");
  }
  const token = process.env.SLACK_TOKEN;
  if (process.env.CHANNELS === undefined) {
    throw new Error(
      "Please set process.env.CHANNELS (target channels separated with comma)"
    );
  }
  const channels = process.env.CHANNELS.split(",")
    .map((el) => el.trim())
    .filter((el) => el);

  return { token, channels };
};

const isSlippedBotMessage: (message: Message) => boolean = (message) =>
  Object.prototype.hasOwnProperty.call(message, "bot_id") &&
  !Object.prototype.hasOwnProperty.call(message, "reactions") &&
  !Object.prototype.hasOwnProperty.call(message, "reply_count") &&
  !Object.prototype.hasOwnProperty.call(message, "pinned_info") &&
  !Object.prototype.hasOwnProperty.call(message, "is_starred");

const deleteMessagesForChannel: (
  channelId: string,
  beforeTime: number,
  webClient: WebClient
) => Promise<Array<Promise<ChatDeleteResponse>>> = async (
  channelId,
  beforeTime,
  webClient
) => {
  let cursor: string | undefined;
  let hasMore: boolean = true;
  const promiseArray = [];
  do {
    const resp = await webClient.conversations.history({
      channel: channelId,
      cursor: cursor,
      latest: beforeTime.toString(),
      limit: 100,
    });
    // console.log(resp1);
    const messages = resp.messages;
    hasMore = resp.has_more || false;
    console.log(`hasMore: ${hasMore}`);

    if (messages === undefined) {
      console.log("message not found");
      break;
    }
    console.log(`messages: ${messages.length}`);
    for (const message of messages) {
      // console.log(message);
      if (isSlippedBotMessage(message)) {
        promiseArray.push(
          webClient.chat.delete({
            channel: channelId,
            ts: message.ts || "0",
          })
        );
        await delay(1000);
      }
      // console.log(message);
    }

    if (hasMore) {
      cursor = resp.response_metadata?.next_cursor;
    }
  } while (hasMore);
  return promiseArray;
};

const main = async () => {
  const { token, channels: targetChannels } = getEnv();
  console.log(`token: ${token}`);
  console.log(`target channels: ${targetChannels}`);

  const currentTime = Date.now() / 1000;
  const lastWeekTime = currentTime; // - 60 * 60 * 24 * 7;
  const beforeTime = lastWeekTime;

  // Initialize
  const webClient = new WebClient(token);

  const resp = await webClient.conversations.list();
  const fetchedChannels = resp.channels;
  if (fetchedChannels === undefined) {
    return;
  }
  console.log(
    `fetched channels: ${fetchedChannels.map((channel) => channel.name)}`
  );

  const promiseArray: Array<Promise<ChatDeleteResponse>> = [];
  for (const targetChannelName of targetChannels) {
    const targetChannel = fetchedChannels.find(
      (channel) => channel.name === targetChannelName
    );
    if (targetChannel?.id === undefined) {
      console.log(`channel not found: ${targetChannel}`);
      continue;
    }
    console.log(`channel: ${targetChannel.name}`);
    promiseArray.push(
      ...(await deleteMessagesForChannel(
        targetChannel.id,
        beforeTime,
        webClient
      ))
    );
  }

  console.log(`wait for promises: ${promiseArray.length}`);
  await Promise.all(promiseArray);
  console.log("DONE!!!!!!!");
};

try {
  main();
} catch (e) {
  console.error(e);
}
