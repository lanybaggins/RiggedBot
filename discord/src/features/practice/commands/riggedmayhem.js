import { ApplicationCommandOptionType } from "discord.js";
import interactionReply from "../../../utils/discord/interactionReply.js";

export const command = {
  name: "riggedmayhem",
  description: "Starts a game of Rigged Caps.",
  //developersOnly: true,
  deferReply: true,
  options: [
    {
      name: "user1",
      description: "The first player.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "user2",
      description: "The second player.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "user3",
      description: "The third player.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "user4",
      description: "The fourth player.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "user5",
      description: "The fifth player.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "user6",
      description: "The sixth player.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "host",
      description: "The host of the game.",
      type: ApplicationCommandOptionType.User,
    },
    {
      name: "reverse",
      description: "Reverse mayhem.",
      type: ApplicationCommandOptionType.Boolean,
    }
  ],
  callback: async (client, interaction) => {
    const author = interaction.user;
    const host = interaction.options.getUser("host");
    if (author.username !== "lanybaggins") {
      await interactionReply(interaction, `You cannot start this type of game!`);
      return;
    }
    let reverse = interaction.options.getBoolean("reverse") ? true : false;
    let users = [];
    let userIds = [];
    for (let i = 1; i <= 6; i++) {
      let user = interaction.options.getUser(`user${i}`);
      if (null === user) {
        continue;
      }
      if (user.bot) {
        await interactionReply(interaction, `You cannot specify a bot as a player!`);
        return;
      }
      if (host && user.id === host.id) {
        await interactionReply(interaction, `You cannot specify the host as a player!`);
        return;
      }
      if (userIds.includes(user.id)) {
        await interactionReply(interaction, `You cannot specify the same user multiple times!`);
        return;
      }
      users.push(user);
      userIds.push(user.id);
    }
    let userSettings = [];
    for (let i = 0; i < users.length; i++) {
      let partnerMod = i % 2 == 0 ? 1 : -1;
      userSettings.push({
        user: users[i],
        role: reverse ? "Crewmate" : "Imposter",
        isImposter: !reverse,
        partner: users[i + partnerMod],
      });
    }
    const hostString = host ? `${host.username}` : "No host";
    if (host) {
      let fields = [
        {
          name: "Game Creator",
          value: `${author.username}`,
          inline: true,
        },
        {
          name: "Host",
          value: hostString,
          inline: true,
        },
        {
          name: "Player Count",
          value: `6`,
          inline: true,
        },
        {
          name: "Imposter Count",
          value: `${reverse ? "reverse mayhem (0)" : "mayhem (6)"}`,
          inline: true,
        }
      ];
      let fields2 = [];
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const userSetting = userSettings[i];
        fields2.push({
          name: `${user.username}`,
          value: `${userSetting.partner.username}`,
          inline: true,
        });
      }
      let embeds = [
        {
          title: `Rigged Caps Mayhem Practice Game`,
          description: `You are the host for this mayhem practice game.  All players are ${reverse ? "crewmates" : "imposters with a partner"}.`,
          fields: fields,
          timestamp: new Date().toISOString(),
        },
        {
          title: `Players`,
          fields: fields2,
        },
      ];
      await host.send({
        content: "Practice Game Started.",
        embeds: embeds,
      });
    }
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const userSetting = userSettings[i];
      let fields = [
        {
          name: "Game Creator",
          value: `${author.username}`,
          inline: true,
        },
        {
          name: "Host",
          value: hostString,
          inline: true,
        },
        {
          name: "Role",
          value: `${userSetting.role}`,
          inline: true,
        },
        {
          name: "Ability",
          value: "The host will assign abilities.",
          inline: true,
        }
      ];
      if (!reverse) {
        fields.push({
          name: "Teammate",
          value: `${userSetting.partner.username}`,
          inline: true,
        });
      }
      let embed = {
        title: `Rigged Caps Practice Game`,
        description: `You have been assigned a role of **${userSetting.role}**.`,
        fields: fields,
        timestamp: new Date().toISOString(),
      };
      await user.send({
        content: "Practice Game Started.",
        embeds: [embed],
      });
    }
    await interactionReply(interaction, `The practice game has been started!`);
  },
};
