import { Client } from "discord.js";
import { config } from "./config.js";
import eventHandler from "./events/eventHandler.js";
import consoleLog from "./utils/log/consoleLog.js";

const client = new Client({
  intents: config.intents,
});

client.config = config

consoleLog(`calling eventHandler`);
await eventHandler(client);

client.login(process.env.TOKEN);
