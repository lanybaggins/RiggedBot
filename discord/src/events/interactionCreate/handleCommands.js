import { MessageFlags } from "discord.js"
import getLocalCommands from "../../utils/controller/getLocalCommands.js";
import interactionReply from "../../utils/discord/interactionReply.js";

export default async (client, interaction) => {
  if (!interaction.isChatInputCommand()) return;

  let localCommands = undefined;
  let commandObject = undefined;
  try {
    const userId = interaction.member ? interaction.member.id : interaction.user.id;
    console.log(`Handling command '${interaction.commandName}' by user '${userId}'.`);

    localCommands = await getLocalCommands();

    commandObject = localCommands.find(
      (cmd) => cmd.name === interaction.commandName
    );

    if (!commandObject) {
      await interactionReply(interaction, "An error has occurred. Command not found.");
      return;
    }

    if (commandObject.developersOnly) {
      if (!client.config.devs.includes(userId)) {
        await interactionReply(interaction, "Only developers are allowed to run this command.");
        return;
      }
    }

    if (commandObject.devEnvironmentOnly) {
      if (client.config.IsProduction) {
        await interactionReply(interaction, "This command can only be ran in the test server.");
        return;
      }
    }

    if (commandObject.serverOnly) {
      if (!interaction.guildId) {
        await interactionReply(interaction, "You cannot run this command outside of a server.");
        return;
      }
    }

    if (commandObject.permissionsRequired?.length) {
      for (const permission of commandObject.permissionsRequired) {
        if (!interaction.member.permissions.has(permission)) {
          await interactionReply(interaction, "You do not have permission to run this command.");
          return;
        }
      }
    }

    if (commandObject.botPermissions?.length) {
      for (const permission of commandObject.botPermissions) {
        const bot = interaction.guild.members.me;

        if (!bot.permissions.has(permission)) {
          await interactionReply(interaction, "I don't have enough permissions.");
          return;
        }
      }
    }
    if (commandObject.deferReply) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      interaction.deferred = true;
    }
    await commandObject.callback(client, interaction);
  } catch (error) {
    if (localCommands != undefined && commandObject != undefined) {
      console.error(`There was an error running the ${commandObject.name} command.`, error);
    } else {
      console.error(`There was an error handling interactionCreate for unknown command.`, error);
    }
    if (interaction) {
      await interactionReply(interaction, "There was an error running this command.").catch((error) => {
        console.error(`There was an error sending the interaction reply on error.`, error);
      });
    }
  }
};
