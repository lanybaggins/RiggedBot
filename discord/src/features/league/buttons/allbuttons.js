import * as RiggedLeague from "../classes/RiggedLeague.js";

export const button = {
  deferReply: false,
  callback: async (client, interaction) => {
    let game = new RiggedLeague.Game();
    await game.handleButton(client, interaction);
  }
}

