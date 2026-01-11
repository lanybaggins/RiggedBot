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
            "415848204136087563", //lanybaggins
            "1405321512088633415", //lanytest
        ],
        mayhemHosts: [
            "415848204136087563", //lanybaggins
            "686655165368893537", //blitzwarlord
            "106940748141711360", //1stcast
        ],
        guilds: [
            {
                guildId: "1342301791664078870",
                leagueChannelId: isProduction ? "1405403401054982195" : "1421520972833493145",
                leagueRoleId: "1342336762675986534",
                staffRoleId: "1405414227740594207"
            }
        ]
    }
};
