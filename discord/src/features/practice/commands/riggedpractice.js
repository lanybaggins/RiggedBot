import { ApplicationCommandOptionType } from "discord.js";
import interactionReply from "../../../utils/discord/interactionReply.js";

export const command = {
  name: "riggedpractice",
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
    },
    {
      name: "imposters",
      description: "The number of imposters in the game.",
      type: ApplicationCommandOptionType.Integer,
      choices: [
        {
          name: "1 imposter",
          value: 1,
        },
        {
          name: "2 imposters",
          value: 2,
        },
      ],
    },
    {
      name: "rollabilities",
      description: "Roll the abilities with this command",
      type: ApplicationCommandOptionType.Boolean,
      choices: [
        {
          name: "true",
          value: true
        },
        {
          name: "false",
          value: false
        }
      ]
    }
  ],
  callback: async (client, interaction) => {
    const author = interaction.user;
    const host = interaction.options.getUser("host");
    let imposterCount = interaction.options.getInteger("imposters");
    if (imposterCount === null) {
      imposterCount = 2;
    }
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
    let imposter1 = Math.floor(Math.random() * userCount);
    let imposter2;
    if (imposterCount === 2) {
      do {
        imposter2 = Math.floor(Math.random() * userCount);
      } while (imposter1 === imposter2);
    }
    let rollAbilities = interaction.options.getBoolean("rollabilities");
    if (rollAbilities === null) {
      rollAbilities = false
    }
    let userSettings = [];
    do {
      let abilityCount = 0;
      for (let i = 0; i < users.length; i++) {
        let isImposter = i === imposter1 || i === imposter2;
        let randomCredits = Math.floor(Math.random() * 100) + 1;
        let ability = "None";
        if (rollAbilities) {
          if (isImposter) {
            if (randomCredits <= 60) {
              abilityCount++;
              ability = "Sabatoge Comms";
            } else if (randomCredits <= 80) {
              abilityCount++;
              ability = isSolo ? "Sabatoge Comms" : "Assassinate";
            }
          } else {
            if (randomCredits <= 60) {
              ability = "Confirm Ejection";
            } else if (randomCredits <= 80) {
              ability = isSolo ? "Confirm Ejection" : "Sheriff";
            }
          }
        }
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
          value: rollAbilities ? `${userSetting.role} - ${userSetting.ability}` : `${userSetting.role}`,
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
      await host.send({
        content: "Practice Game Started.",
        embeds: embeds,
      });
    }
    let isSolo = imposter2 === undefined;
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
          value: rollAbilities ? `${userSetting.ability}` : "Contact the host",
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
      await user.send({
        content: "Practice Game Started.",
        embeds: [embed],
      });
    }
    await interactionReply(interaction, `The practice game has been started!`);
  },
};
