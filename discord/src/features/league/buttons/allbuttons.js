import { RiggedLeagueGame } from "../classes/RiggedLeagueGame.js";

export const button = {
  deferReply: false,
  callback: async (client, interaction) => {
    var game = new RiggedLeagueGame();
    game.handleButton(client, interaction);
  }
}

