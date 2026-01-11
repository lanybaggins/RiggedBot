import { ApplicationCommandOptionType } from "discord.js";
import interactionReply from "../../../../utils/discord/interactionReply.js";

export const command = {
  name: "riggedcreeper",
  description: "Starts a game of Rigged Caps.",
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
    },
    {
      name: "host",
      description: "The host of the game.",
      type: ApplicationCommandOptionType.User,
    }
  ],
  callback: async (client, interaction) => {
    const author = interaction.user;
    const host = interaction.options.getUser("host");
    const possibleHosts = ["blitzwarlord", "lanybaggins", "1stcast"];
    if (!possibleHosts.includes(author.username)) {
        await interactionReply(interaction, `You cannot start this type of game!`);
        return;
    }
    const vigilante = false
    const rollAbilities = false;
    if (vigilante && rollAbilities) {
      await interactionReply(interaction, `You cannot roll abilities and have a vigilante!`);
      return;
    }
    const imposterCount = 2;
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
    const userCount = users.length;
    const imposter1 = 0;
    const imposter2 = 1;
    const isSolo = false;
    let userSettings = [];
    do {
      for (let i = 0; i < users.length; i++) {
        let isImposter = i === imposter1 || i === imposter2;
        let ability = "None";
        userSettings.push({
          user: users[i],
          role: isImposter ? "Imposter" : "Crewmate",
          isImposter: isImposter,
          ability: ability,
        });
      }
    } while (rollAbilities && (abilityCount < 2 || abilityCount > 4));
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
          value: `${userCount}`,
          inline: true,
        },
        {
          name: "Imposter Count",
          value: `${imposterCount}`,
          inline: true,
        },
        {
          name: "Roll Abilities",
          value: `${rollAbilities}`,
          inline: true
        }
      ];
      let fields2 = [];
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const userSetting = userSettings[i];
        fields2.push({
          name: `${user.username}`,
          value: rollAbilities || vigilante ? `${userSetting.role} - ${userSetting.ability}` : `${userSetting.role}`,
          inline: true,
        });
      }
      let embeds = [
        {
          title: `Rigged Caps Practice Game`,
          description: `You are the host for this practice game.`,
          fields: fields,
          timestamp: new Date().toISOString(),
        },
        {
          title: `Players`,
          fields: fields2,
        },
      ];
      try {
        await host.send({
          content: "Practice Game Started.",
          embeds: embeds,
        });
      } catch (err) {
        const responseMessage = err.code === 50007 ?
          `Could not send DM to host! Host must enable DMs from server members and try again.` :
          `Error sending DM to host! ${err.message}`;
        console.log(responseMessage);
        await interactionReply(interaction, responseMessage);
        return;
      }
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
          value: userSetting.role,
          inline: true,
        },
        {
          name: "Ability",
          value: "The host will assign abilities.",
          inline: true,
        },
      ];
      if (userSetting.isImposter && !isSolo) {
        const teamMate = i === imposter1 ? users[imposter2] : users[imposter1];
        fields.push({
          name: "Teammate",
          value: `${teamMate.username}`,
          inline: true,
        });
      }
      let embed = {
        title: `Rigged Caps Practice Game`,
        description: `You have been assigned a role of **${userSetting.role}**.`,
        fields: fields,
        timestamp: new Date().toISOString(),
      };
      try {
        await user.send({
          content: "Practice Game Started.",
          embeds: [embed],
        });
      } catch (err) {
        const errorRecipient = host ? host : interaction.user;
        const responseMessage = err.code === 50007 ?
          `Could not send DM to ${user.username}! They must enable DMs from server members and try again.` :
          `Error sending DM to ${user.username}! ${err.message}`;
        console.log(responseMessage);
        try {
          await errorRecipient.send(responseMessage);
        } catch (err2) {
            console.log(`Also could not send error message to host/author. ${err2.message}`);
            interactionReply(interaction, `Error sending DM to ${user.username}, and could not notify the host/author!\n${err.message}\n${err2.message}`);
            return;
        }
      }
    }
    await interactionReply(interaction, `The practice game has been started!`);
  },
};
