import { IntentsBitField } from "discord.js";

export default (isProduction) => {
  return {
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent,
    ],
    isProduction: isProduction,
    devs: [
      "415848204136087563"
    ],
    guilds: [
      {
        guildId: "1342301791664078870",
        leagueChannelId: isProduction ? "1405403401054982195" : "1421520972833493145",
        staffRoleId: "1405414227740594207"
      }
    ]
  }
};
