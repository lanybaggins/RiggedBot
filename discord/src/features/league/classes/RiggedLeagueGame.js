import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import interactionReply from "../../../utils/discord/interactionReply.js";
import consoleLog from "../../../utils/log/consoleLog.js";
const BUTTONID_SIGNUP = "league:announcement:signup";
const BUTTONID_SIGNUPCANCEL = "league:announcement:signupCancel";
const BUTTONID_GAMESTART = "league:announcement:gameStart";
const BUTTONID_GAMECANCEL = "league:announcement:gameCancel";
const BUTTONID_BUY_SABOTAGECOMMS = "league:buy:sabotageComms";
const BUTTONID_BUY_ASSASSINATE = "league:buy:assassinate";
const BUTTONID_BUY_CONFIRMEJECTION = "league:buy:confirmEjection";
const BUTTONID_BUY_SHERIFF = "league:buy:Sheriff";

export class RiggedLeagueGame {
  async initFromAnnouncement(interaction) {
    let message = interaction.message;
    let embeds = message.embeds;
    const fields = embeds[0].fields;

    const hostField = fields.find((field) => field.name === "Host");
    // convert hostIdString to a user object
    const hostIdString = hostField.value;
    const hostId = hostIdString.replace(/<@!?(\d+)>/, "$1");
    let host = await interaction.client.users.cache.get(hostId);
    if (!host) {
      host = interaction.client.users.fetch(hostId).catch(() => null);
    }
    if (!host) {
      throw new Error("Host user not found.");
      return;
    }
    this.host = host;

    const gameIdField = fields.find((field) => field.name === "Game ID");
    this.gameId = gameIdField.value;

    let statusField = fields.find((field) => field.name === "Status");
    this.status = statusField.value;

    let playerCountField = fields.find(
      (field) => field.name === "Player Count"
    );
    this.playerCount = parseInt(playerCountField.value);

    let imposterCountField = fields.find(
      (field) => field.name === "Imposter Count"
    );
    this.imposterCount = parseInt(imposterCountField.value);

    const playerFields = fields.filter(
      (field) =>
        field.name.startsWith("Player") && field.name !== "Player Count"
    );
    this.playerIds = [];
    let signedUpPlayers = playerFields.filter(
      (field) => field.value !== "open"
    );
    for (const field of signedUpPlayers) {
      const playerId = field.value.replace(/<@!?(\d+)>/, "$1");
      this.playerIds.push(playerId);
    }
  }
  async initFromPlayerDM(interaction) {
    let message = interaction.message;
    let embeds = message.embeds;
    const fields = embeds[0].fields;
    const hostField = fields.find((field) => field.name === "Host");
    // convert hostField Username to a user object
    const hostUsername = hostField.value;
    let host = interaction.client.users.cache.find(
      (user) => user.username === hostUsername
    );
    if (!host) {
      consoleLog(`Host user not found in cache, erroring`);
      await interactionReply(interaction, "Error: Host user not found.");
      return;
    }
    this.host = host;

    const gameIdField = fields.find((field) => field.name === "Game ID");
    this.gameId = gameIdField.value;
  }
  buildAnnouncement() {
    let row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(BUTTONID_SIGNUP)
          .setLabel("Sign Up")
          .setStyle(ButtonStyle.Primary)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId(BUTTONID_SIGNUPCANCEL)
          .setLabel("Cancel Sign Up")
          .setStyle(ButtonStyle.Danger)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId(BUTTONID_GAMECANCEL)
          .setLabel("Cancel Game")
          .setStyle(ButtonStyle.Danger)
      );
    let embed = {
      title: "Rigged Caps - League Game Starting Soon",
      description: "Sign up for this league game by clicking the button below.",
      fields: [
        {
          name: "Game ID",
          value: this.gameId,
          inline: true,
        },
        {
          name: "Player Count",
          value: this.playerCount,
          inline: true,
        },
        {
          name: "Imposter Count",
          value: this.imposterCount,
          inline: true,
        },
        {
          name: "Host",
          value: `${this.host}`,
          inline: true,
        },
        {
          name: "Status",
          value: this.status,
        },
      ],
      timestamp: new Date().toISOString(),
    };
    if (this.startTime !== null) {
      // convert to <t:UnixTimestamp:F> format
      const unixTimestamp = Math.floor(this.startTime.getTime() / 1000);
      embed.fields.push({
        name: "Start Time",
        value: `<t:${unixTimestamp}:F>`,
        inline: true,
      });
    }
    for (let i = 1; i <= this.playerCount; i++) {
      embed.fields.push({
        name: `Player ${i}`,
        value: "open",
        inline: true,
      });
    }
    const r = {
      content: "A new league game has been announced!",
      embeds: [embed],
      components: [row],
    };
    return r;
  }
  async sendAnnouncement(channel, gameId, host, playerCount, imposterCount) {
    this.gameId = gameId;
    this.host = host;
    this.playerCount = playerCount;
    this.imposterCount = imposterCount;
    this.players = [];
    this.status = "Setup";
    const r = this.buildAnnouncement();
    await channel.send(r);
  }
  async handleButton(client, interaction) {
    const customId = interaction.customId;
    if (customId === BUTTONID_SIGNUP) {
      this.signup(interaction);
    } else if (customId === BUTTONID_SIGNUPCANCEL) {
      this.signupCancel(interaction);
    } else if (customId === BUTTONID_GAMESTART) {
      this.start(interaction);
    } else if (customId === BUTTONID_GAMECANCEL) {
      this.cancel(interaction);
    } else if (customId.startsWith("leaguegame_buy_")) {
      this.buyAbility(interaction);
    } else {
      await interactionReply(interaction, "Unknown button interaction");
    }
  }
  async signup(interaction) {
    await this.initFromAnnouncement(interaction)
    const message = interaction.message;
    let embeds = message.embeds;
    const fields = embeds[0].fields;
    let statusField = fields.find((field) => field.name === "Status");
    let components = message.components;

    // check that the user isn't the host
    if (this.host.id === `${interaction.user.id}`) {
      await interactionReply(interaction, "You are the host of this game and cannot sign up as a player.");
      return;
    }
    // check that user is not already signed up
    const alreadySignedUp = this.playerIds.includes(`${interaction.user.id}`);
    if (alreadySignedUp) {
      await interactionReply(interaction, "You are already signed up for this game.");
      return;
    }
    if (this.playerIds.length >= this.playerCount) {
      await interactionReply(interaction, "No open slots available.");
      return;
    }
    // find an open slot
    const openSlots = fields.filter(
      (field) =>
        field.name.startsWith("Player") &&
        field.name !== "Player Count" &&
        field.value === "open"
    );
    const takingSlot = openSlots[0];
    const takingSlotIndex = fields.indexOf(takingSlot);
    fields[takingSlotIndex].value = `${interaction.user}`;
    this.playerIds.push(`${interaction.user.id}`);
    // check if the game is now full
    consoleLog(
      `PlayerCount: ${this.playerCount}, PlayerIds length: ${this.playerIds.length}`
    );
    let gameFull = this.playerIds.length >= this.playerCount;
    if (gameFull) {
      let row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(BUTTONID_GAMESTART)
            .setLabel("Start Game")
            .setStyle(ButtonStyle.Primary)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(BUTTONID_SIGNUPCANCEL)
            .setLabel("Cancel Sign Up")
            .setStyle(ButtonStyle.Danger)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(BUTTONID_GAMECANCEL)
            .setLabel("Cancel Game")
            .setStyle(ButtonStyle.Danger)
        );
      components[0] = row;
      statusField.value = "Ready";
    }
    message.edit({
      embeds: embeds,
      components: components,
    });
    await interactionReply(interaction, `You have signed up for the game!`);
    if (gameFull) {
      await this.host.send(`Game ID ${this.gameId} is ready to start!`);
    }
  }
  async signupCancel(interaction) {
    await this.initFromAnnouncement(interaction)
    const message = interaction.message;
    let embeds = message.embeds;
    const fields = embeds[0].fields;
    let statusField = fields.find((field) => field.name === "Status");
    let components = message.components;

    // check that the user is signed up
    const alreadySignedUp = this.playerIds.includes(`${interaction.user.id}`);
    if (!alreadySignedUp) {
      await interactionReply(interaction, "You are not signed up for this game.");
      return;
    }
    // find the slot the user is in
    const userSlot = fields.find(
      (field) =>
        field.name.startsWith("Player") &&
        field.name !== "Player Count" &&
        field.value === `${interaction.user}`
    );
    const userSlotIndex = fields.indexOf(userSlot);
    fields[userSlotIndex].value = "open";
    this.playerIds = this.playerIds.filter(
      (id) => id !== `${interaction.user.id}`
    );
    // if the game was full, change it back to setup
    const oldStatus = statusField.value
    if (oldStatus === "Ready") {
      let row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(BUTTONID_SIGNUP)
            .setLabel("Sign Up")
            .setStyle(ButtonStyle.Primary)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(BUTTONID_SIGNUPCANCEL)
            .setLabel("Cancel Sign Up")
            .setStyle(ButtonStyle.Danger)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(BUTTONID_GAMECANCEL)
            .setLabel("Cancel Game")
            .setStyle(ButtonStyle.Danger)
        );
      components[0] = row;
      statusField.value = "Setup";
    }
    message.edit({
      embeds: embeds,
      components: components,
    });
    await interactionReply(interaction, `You have cancelled your sign up for the game.`);
    // notify the host if the game was ready
    if (oldStatus === "Ready") {
      await this.host.send(`Player ${interaction.user.username} has cancelled their sign up for game ID ${this.gameId}. The game is no longer ready to start.`);
    }
  }
  async resolvePlayerIds(interaction) {
    // resolve the playerIds to user objects
    let playerResolveError = null;
    let players = [];
    for (const playerId of this.playerIds) {
      let player = interaction.client.users.cache.get(playerId);
      if (!player) {
        player = await interaction.client.users
          .fetch(playerId)
          .catch(() => null);
      }
      if (!player) {
        playerResolveError = playerId;
        console.error(`Player with ID ${playerId} not found.`);
        return;
      }
      players.push(player);
    }
    if (playerResolveError) {
      await interactionReply(interaction, `Error resolving player with ID ${playerResolveError}. Please try again later.`);
      return;
    }
    this.players = players;
  }
  async start(interaction) {
    await this.initFromAnnouncement(interaction)
    const message = interaction.message;
    let embeds = message.embeds;
    const fields = embeds[0].fields;
    let statusField = fields.find((field) => field.name === "Status");
    // check that the user is the host
    if (this.host.id !== `${interaction.user.id}`) {
      await interactionReply(interaction, "You are not the host of this game.");
      return;
    }
    // check that the game is not already cancelled or started
    if (this.status !== "Ready") {
      await interactionReply(interaction, "This game is not ready to start or already started.");
      return;
    }
    // check that the game is full
    if (this.playerIds.length < this.playerCount) {
      await interactionReply(interaction, "This game is not full yet.");
      return;
    }
    // resolve the playerIds to user objects
    await this.resolvePlayerIds(interaction).catch(async (error) => {
      await interactionReply(interaction, "Error resolving player IDs: " + error.message);
      console.error("Error resolving player IDs:", error);
      return;
    });
    // roll one or two players to be imposters randomly, this.imposterCount
    let imposter1 = Math.floor(Math.random() * this.playerIds.length);
    let imposter2;
    if (this.imposterCount === 2) {
      do {
        imposter2 = Math.floor(Math.random() * this.playerIds.length);
      } while (imposter1 === imposter2);
    }
    this.imposter1 = this.players[imposter1];
    this.imposter2 = null;
    if (this.imposterCount === 2) {
      this.imposter2 = this.players[imposter2];
    }
    // for now lets roll credits randomly
    this.rollCredits();
    // send a message to the players with their roles
    this.players.forEach((player) => {
      this.sendStartToPlayer(player);
    });
    // send a message to the host with the game details
    this.sendStartToHost();
    // update the embed
    statusField.value = "Started";
    // edit the message to upadte the status and remove buttons
    message.edit({
      embeds: embeds,
      components: [],
    });
    // reply
    await interactionReply(interaction, "The game has started! Players have been notified.");
  }
  async cancel(interaction) {
    await this.initFromAnnouncement(interaction)
    const message = interaction.message;
    let embeds = message.embeds;
    let fields = embeds[0].fields;
    let statusField = fields.find((field) => field.name === "Status");
    // check that the user is the host
    consoleLog(`Host: ${JSON.stringify(this.host)}`);
    if (this.host.id !== `${interaction.user.id}`) {
      await interactionReply(interaction, "You are not the host of this game.");
      return;
    }
    // check that the game is not already cancelled or started
    if (this.status !== "Ready" && this.status !== "Setup") {
      await interactionReply(interaction, "This game is not in a state that can be cancelled.");
      return;
    }
    // update the embed
    statusField.value = "Cancelled";
    // edit the message
    message.edit({
      embeds: embeds,
      components: [],
    });
    // reply
    await interactionReply(interaction, "The game has been cancelled.");
  }
  rollCredits() {
    // temporary solution to roll credits for players
    // roll for random credits that can be spent on abilities.  Credits will be either 0, 250, or 500, with a 1/5 chance for 500 and a 2/5 chance for 250, and a 2/5 chance for 0.
    let playerCredits = [];
    for (const playerId of this.playerIds) {
      let random = Math.floor(Math.random() * 100) + 1; // random credits between 1 and 100
      let credits;
      random = 100; // don't use the credit system at the moment. Just give everyone 0 credits.
      if (random <= 20) {
        credits = 500; // 1/5 chance
      } else if (random <= 60) {
        credits = 250; // 2/5 chance
      } else {
        credits = 0; // 2/5 chance
      }
      playerCredits.push({
        playerId: playerId,
        credits: credits,
      });
      this.playerCredits = playerCredits;
    }
  }
  async sendStartToPlayer(user) {
    consoleLog(`Sending start message to player ${user.id}`);
    let isImposter =
      user.id === this.imposter1.id || user.id === this.imposter2?.id;
    let role = isImposter ? "Imposter" : "Crewmate";
    // get credits from this.playerCredits
    let creditsObject = this.playerCredits.find(
      (pc) => pc.playerId === user.id
    );
    let credits = creditsObject.credits;
    let fields = [
      {
        name: "Game ID",
        value: this.gameId,
        inline: true,
      },
      {
        name: "Host",
        value: `${this.host.username}`,
        inline: true,
      },
      {
        name: "Role",
        value: role,
        inline: true,
      },
      {
        name: "Available Credits",
        value: `${credits}`,
        inline: true,
      },
    ];
    if (isImposter && this.imposterCount === 2) {
      let imposterPartner =
        this.imposter1.id === user.id ? this.imposter2 : this.imposter1;
      fields.push({
        name: "Imposter Partner",
        value: `${imposterPartner.username}`,
        inline: true,
      });
    }
    let embed = {
      title:
        "If you have credits you can purchase them using the buttons below.",
      description: `You have been chosen to be ${role}.`,
      fields: fields,
      timestamp: new Date().toISOString(),
    };
    let components = [];
    if (isImposter) {
      if (credits >= 250) {
        components.push(
          new ButtonBuilder()
            .setCustomId(BUTTONID_BUY_SABOTAGECOMMS)
            .setLabel("Sabotage Comms (250 credits)")
            .setStyle(ButtonStyle.Primary)
        );
      }
      if (credits >= 500 && this.imposterCount === 2) {
        components.push(
          new ButtonBuilder()
            .setCustomId(BUTTONID_BUY_ASSASSINATE)
            .setLabel("Assassinate (500 credits)")
            .setStyle(ButtonStyle.Primary)
        );
      }
    } else {
      if (credits >= 250) {
        components.push(
          new ButtonBuilder()
            .setCustomId(BUTTONID_BUY_CONFIRMEJECTION)
            .setLabel("Confirm Ejection (250 credits)")
            .setStyle(ButtonStyle.Primary)
        );
      }
      if (credits >= 500) {
        components.push(
          new ButtonBuilder()
            .setCustomId(BUTTONID_BUY_SHERIFF)
            .setLabel("Sheriff (500 credits)")
            .setStyle(ButtonStyle.Primary)
        );
      }
    }
    let rows = [];
    if (components.length > 0) {
      let row = new ActionRowBuilder();
      components.forEach((component) => {
        row.addComponents(component);
      });
      rows.push(row);
    }
    await user.send({
      content: "League Game Started.",
      embeds: [embed],
      components: rows,
    })
  }
  async sendStartToHost() {
    // send a message to the host with the game details, player roles and credits
    consoleLog(`Sending start message to host ${this.host.id}`);
    let embedMain = {
      title: "League Game Started",
      description: `The game has started! Here are the details:`,
      fields: [
        {
          name: "Game ID",
          value: this.gameId,
          inline: true,
        },
        {
          name: "Player Count",
          value: `${this.playerCount}`,
          inline: true,
        },
        {
          name: "Imposter Count",
          value: `${this.imposterCount}`,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };
    let playerEmbeds = [];
    this.players.forEach((player) => {
      let isImposter =
        player.id === this.imposter1.id || player.id === this.imposter2?.id;
      let role = isImposter ? "Imposter" : "Crewmate";
      let creditsObject = this.playerCredits.find(
        (pc) => pc.playerId === player.id
      );
      let credits = creditsObject.credits;
      let embed = {
        fields: [
          {
            name: "Player",
            value: `${player.username}`,
            inline: true,
          },
          {
            name: "Role",
            value: role,
            inline: true,
          },
          {
            name: "Credits",
            value: `${credits}`,
            inline: true,
          },
        ],
      };
      playerEmbeds.push(embed);
    });
    let components = [];
    let embeds = [embedMain, ...playerEmbeds];
    await this.host.send({
      content: "League Game Details",
      embeds: embeds,
      components: components,
    });
  }
  async buyAbility(interaction) {
    await this.initFromPlayerDM(interaction)
    // get credits from fields
    let message = interaction.message;
    let embeds = message.embeds;
    const fields = embeds[0].fields;
    let creditsField = fields.find(
      (field) => field.name === "Available Credits"
    );
    let credits = parseInt(creditsField.value);
    // determine which ability was purchased
    let abilityCost = 0;
    let ability = "unknown";
    if (
      interaction.customId === BUTTONID_BUY_SABOTAGECOMMS
    ) {
      abilityCost = 250;
      ability = "Sabotage Comms";
    } else if (
      interaction.customId === BUTTONID_BUY_ASSASSINATE
    ) {
      abilityCost = 500;
      ability = "Assassinate";
    } else if (
      interaction.customId === BUTTONID_BUY_CONFIRMEJECTION
    ) {
      abilityCost = 250;
      ability = "Confirm Ejection";
    } else if (
      interaction.customId === BUTTONID_BUY_SHERIFF
    ) {
      abilityCost = 500;
      ability = "Sheriff";
    } else {
      await interactionReply(interaction, "Unknown ability.");
      return;
    }
    // check if user has enough credits
    if (credits < abilityCost) {
      await interactionReply(interaction, `You do not have enough credits to buy ${ability}.`);
      return;
    }
    credits -= abilityCost;
    // send the host a DM
    await this.host.send(
      `${interaction.user.username} has purchased ${ability} for ${abilityCost} credits in game ID ${this.gameId}.`
    );
    creditsField.value = `${credits}`;
    // update the embed, remove components
    message.edit({
      embeds: embeds,
      components: [],
    });
    // reply to the user
    await interactionReply(interaction, `You have purchased ${ability} for ${abilityCost} credits.`);
  }
}
