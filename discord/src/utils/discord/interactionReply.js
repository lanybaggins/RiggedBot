import { MessageFlags } from "discord.js"
import consoleLog from "../log/consoleLog.js";
export default async (interaction, content, flags = undefined, options = {}) => {
  consoleLog(`Replying to interaction with content: ${content}`);
  if (flags === undefined) {
    flags = MessageFlags.Ephemeral
  }
  let args = {
    content: content,
    flags: flags,
    ...options
  }
  if (interaction.deferred) {
    await interaction.followUp(args);
  } else {
    await interaction.reply(args);
  }
}
