import { MessageFlags } from "discord.js"
export default async (interaction, content, flags = undefined, options = {}) => {
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
