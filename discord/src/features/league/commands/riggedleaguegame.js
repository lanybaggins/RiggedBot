import { ApplicationCommandOptionType } from "discord.js";
import interactionReply from "../../../utils/discord/interactionReply.js";
import { RiggedLeagueGame } from "../classes/RiggedLeagueGame.js";

export const command = {
  name: "riggedleaguegame",
  description: "Announces a game of Rigged Caps with league settings.",
  serverOnly: true,
  devEnvironmentOnly: true,
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
    const guildId = interaction.guildId;
    const guildSettings = client.config.guilds.find((g) => g.guildId === guildId);
    if (!guildSettings || !(guildSettings?.leagueChannelId)) {
      await interactionReply(interaction, "League commands are not enabled on this server.");
      return;
    }
    if (!interaction.member.roles.cache.has(guildSettings.staffRoleId)) {
      await interactionReply(interaction, "You do not have permission to run this command.");
      return;
    }
    const channelId = guildSettings.leagueChannelId;
    let channel = client.channels.cache.get(channelId);
    if (!channel) {
      channel = await client.channels.fetch(channelId);
    }
    if (!channel) {
      await interactionReply(interaction, "League channel not found.");
      return;
    }
    const gameId = interaction.id;
    let host = interaction.options.getUser("host");
    host = host ? host : interaction.user;
    if (host.bot) {
      await interactionReply(interaction, `You cannot specify a bot as the host!`);
      return;
    }
    let playerCount = interaction.options.getInteger("players");
    playerCount = playerCount ? playerCount : 6;
    let imposterCount = 2;
    let game = new RiggedLeagueGame();
    let startTime = interaction.options.getString("starttime");
    game.startTime = null;
    if (startTime) {
      const parsedTime = Date.parse(startTime + " UTC");
      if (isNaN(parsedTime)) {
        await interactionReply(interaction, `The start time format is invalid! Please use the format: YYYY-MM-DD HH:MM in UTC time.`);
        return;
      }
      const now = new Date();
      if (parsedTime < now.getTime()) {
        await interactionReply(interaction, `The start time must be in the future!`);
        return;
      }
      game.startTime = new Date(parsedTime);
    }
    await game.sendAnnouncement(channel, gameId, host, playerCount, imposterCount);
    await interactionReply(interaction, `Command ran successfully! A new league game has been announced in ${channel}.`);
  },
};
