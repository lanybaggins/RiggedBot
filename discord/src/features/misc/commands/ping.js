import interactionReply from "../../../utils/discord/interactionReply.js";

export const command = {
  name: "ping",
  description: "Pong!",
  developersOnly: true,
  //deferReply: true,
  callback: async (client, interaction) => {
    await interactionReply(interaction, `Pong! ${client.ws.ping}ms`);
  },
};
