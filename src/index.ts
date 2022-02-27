import delay from "./delay";

import dotenv from "dotenv";
import {
  WebClient,
  ConversationsHistoryArguments,
  ChatDeleteArguments,
} from "@slack/web-api";

main();
async function main() {
  dotenv.config();
  // Read a token from the environment variables
  if (process.env.SLACK_TOKEN === undefined) {
    throw new Error("Please set process.env.SLACK_TOKEN (User OAuth Token)");
  }
  const token = process.env.SLACK_TOKEN;
  console.log(`token: ${token}`);
  if (process.env.CHANNELS === undefined) {
    throw new Error(
      "Please set process.env.CHANNELS (target channels separated with comma)"
    );
  }
  const targetChannels = process.env.CHANNELS.split(",")
    .map((el) => el.trim())
    .filter((el) => el);
  console.log(`target channels: ${targetChannels}`);

  // Initialize
  const web = new WebClient(token);

  const currentSlackTS = Date.now() / 1000;
  const lastweekSlackTS = currentSlackTS; // - 60 * 60 * 24 * 7;
  let ts = lastweekSlackTS;

  try {
    const resp = await web.conversations.list();
    const fetchedChannels = resp.channels as Array<any> | undefined;
    if (fetchedChannels == undefined) {
      return;
    }
    console.log(`fetched channels: ${fetchedChannels.map((c) => c.name)}`);

    let promiseArray = [];
    for (let targetChannel of targetChannels) {
      const channel = fetchedChannels.find((c) => c.name === targetChannel);
      if (channel == undefined) {
        console.log(`channel not found: ${targetChannel}`);
        continue;
      }
      console.log(`channel: ${channel.name}`);
      let cursor: string | undefined = undefined;
      let hasMore: boolean = true;
      do {
        const params: ConversationsHistoryArguments = {
          channel: channel.id,
          cursor: cursor,
          latest: ts.toString(),
          limit: 100,
        };
        const resp1 = await web.conversations.history(params);
        //console.log(resp1);
        const messages = resp1.messages as Array<any> | undefined;
        hasMore = resp1.has_more as boolean;
        console.log(`hasMore: ${hasMore}`);

        if (messages == undefined) {
          break;
        }
        console.log(`messages: ${messages.length}`);
        for (const message of messages) {
          //console.log(message);
          if (message.hasOwnProperty("reactions")) continue;
          if (message.hasOwnProperty("reply_count")) continue;
          if (message.hasOwnProperty("pinned_info")) continue;
          if (message.hasOwnProperty("is_starred")) continue;
          if (!message.hasOwnProperty("bot_id")) continue;
          // console.log(message);
          const web = new WebClient(token);
          const params: ChatDeleteArguments = {
            channel: channel.id,
            ts: message.ts,
          };
          promiseArray.push(web.chat.delete(params));
          await delay(1000);
        }

        if (hasMore) {
          cursor = (resp1.response_metadata as any).next_cursor as
            | string
            | undefined;
        }
      } while (hasMore);
    }

    console.log(`wait for promises: ${promiseArray.length}`);
    await Promise.all(promiseArray);
    console.log("DONE!!!!!!!");
  } catch (e) {
    console.log(e);
  }
}
