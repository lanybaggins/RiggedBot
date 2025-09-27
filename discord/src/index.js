import { Client } from "discord.js";
import config from "./config.js";
import eventHandler from "./events/eventHandler.js";
import consoleLog from "./utils/log/consoleLog.js";

const isProduction = process.env.NODE_ENV != "development";
let configObj = config(isProduction);
const client = new Client({
  intents: configObj.intents,
});

client.config = configObj

consoleLog(`calling eventHandler`);
await eventHandler(client);

client.login(process.env.TOKEN);
