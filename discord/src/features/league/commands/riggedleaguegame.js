import { ApplicationCommandOptionType } from "discord.js";
import * as RiggedLeague from "../classes/RiggedLeague.js";

export const command = {
  name: "riggedleaguegame",
  description: "Announces a game of Rigged Caps with league settings.",
  serverOnly: true,
  devEnvironmentOnly: false,
  deferReply: true,
  options: [
    {
      name: "host",
      description: "The host of the game.",
      type: ApplicationCommandOptionType.User,
    },
    {
      name: "players",
      description: "The number of players in the game.",
      type: ApplicationCommandOptionType.Integer,
      choices: [
        {
          name: "5 players",
          value: 5,
        },
        {
          name: "6 players",
          value: 6,
        }
      ],
      required: false,
    },
    {
      name: "starttime",
      description: "Preschedule game start.  Enter in UTC time format: YYYY-MM-DD HH:MM",
      type: ApplicationCommandOptionType.String,
    },
  ],
  callback: async (client, interaction) => {
    let game = new RiggedLeague.Game();
    await game.handleCommand(client, interaction);
  },
};
