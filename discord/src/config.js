import { IntentsBitField } from "discord.js";

export const config = {
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
  isProduction: process.env.NODE_ENV != "development",
  devs: [
    "415848204136087563"
  ],
  guilds: [
    {
      guildId: "1342301791664078870",
      leagueChannelId: "1405403401054982195",
      staffRoleId: "1405414227740594207"
    }
  ]
};
