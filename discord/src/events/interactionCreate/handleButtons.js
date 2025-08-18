import fs from "fs";
import { MessageFlags } from "discord.js"
import interactionReply from "../../utils/discord/interactionReply.js";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (client, interaction) => {
  if (!interaction.isButton()) return;

  let buttonHandler;
  try {
    const userId = interaction.member ? interaction.member.id : interaction.user.id;
    console.log(`Handling button ${interaction.customId} by user '${userId}'.`)

    const [feature, action, ...rest] = interaction.customId.split(":");
    const featurePath = path.join(__dirname, "..", "..", "features", feature);
    if (!fs.existsSync(featurePath)) {
      await interactionReply(interaction, `Feature "${feature}" not found.`);
      return;
    }
    const candidate = path.join(featurePath, "buttons", action, ...rest) + ".js";
    const fallback = path.join(featurePath, "buttons", "allbuttons.js");
    const filePath = fs.existsSync(candidate) ? candidate : (fs.existsSync(fallback) ? fallback : null);
    if (!filePath) {
      await interactionReply(interaction, `Button action not found in feature "${feature}".`);
      return;
    }
    const mod = await import(pathToFileURL(filePath).href);
    buttonHandler = mod.button;

    if (buttonHandler.deferReply) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    }
    await buttonHandler.callback(client, interaction);
  } catch (error) {
    if (buttonHandler != undefined) {
      console.error(`There was an error running the button ${interaction.customId}.`, error);
    } else {
      console.error(`There was an error handling interactionCreate for unknown button.`, error);
    }
    if (interaction) {
      await interactionReply(interaction, "There was an error running this command.").catch((error) => {
        console.error(`There was an error sending the interaction reply on error.`, error);
      });
    }
  }
};
