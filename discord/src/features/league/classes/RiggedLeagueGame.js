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
  async initFromAnnouncement() {
    let message = this.interaction.message;
    let embeds = message.embeds;
    this.timestamp = new Date(embeds[0].timestamp);
    const fields = embeds[0].fields;
    const hostField = fields.find((field) => field.name === "Host");
    // convert hostIdString to a user object
    const hostIdString = hostField.value;
    const hostId = hostIdString.replace(/<@!?(\d+)>/, "$1");
    let host = await this.client.users.cache.get(hostId);
    if (!host) {
      host = this.client.users.fetch(hostId).catch(() => null);
    }
    if (!host) {
      throw new Error("Host user not found.");
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
  async initFromPlayerDM() {
    let message = this.interaction.message;
    let embeds = message.embeds;
    this.timestamp = new Date(embeds[0].timestamp);
    const fields = embeds[0].fields;
    const hostField = fields.find((field) => field.name === "Host");
    // convert hostField Username to a user object
    const hostUsername = hostField.value;
    let host = this.client.users.cache.find(
      (user) => user.username === hostUsername
    );
    if (!host) {
      consoleLog(`Host user not found in cache, erroring`);
      await interactionReply(this.interaction, "Error: Host user not found.");
      return;
    }
    this.host = host;

    const gameIdField = fields.find((field) => field.name === "Game ID");
    this.gameId = gameIdField.value;
  }
  async handleCommand(client, interaction) {
    this.interactionType = 'command';
    this.client = client;
    this.interaction = interaction;
    this.timestamp = new Date();
    // check if league commands are enabled on this server and if the user has the staff role
    const guildId = this.interaction.guildId;
    const guildSettings = this.client.config.guilds.find((g) => g.guildId === guildId);
    if (!guildSettings || !(guildSettings?.leagueChannelId)) {
      await interactionReply(this.interaction, "League commands are not enabled on this server.");
      return;
    }
    if (!this.interaction.member.roles.cache.has(guildSettings.staffRoleId)) {
      await interactionReply(this.interaction, "You do not have permission to run this command.");
      return;
    }
    const channelId = guildSettings.leagueChannelId;
    let channel = this.client.channels.cache.get(channelId);
    if (!channel) {
      channel = await this.client.channels.fetch(channelId);
    }
    if (!channel) {
      await interactionReply(this.interaction, "League channel not found.");
      return;
    }
    this.gameId = this.interaction.id;
    this.host = this.interaction.options.getUser("host") ?? this.interaction.user;
    if (this.host.bot) {
      await interactionReply(this.interaction, `You cannot specify a bot as the host!`);
      return;
    }
    this.playerCount = this.interaction.options.getInteger("players") ?? 6;
    this.imposterCount = 2;
    let startTime = this.interaction.options.getString("starttime");
    this.startTime = null;
    if (startTime) {
      const parsedTime = Date.parse(startTime + " UTC");
      if (isNaN(parsedTime)) {
        await interactionReply(this.interaction, `The start time format is invalid! Please use the format: YYYY-MM-DD HH:MM in UTC time.`);
        return;
      }
      const now = new Date();
      if (parsedTime < now.getTime()) {
        await interactionReply(this.interaction, `The start time must be in the future!`);
        return;
      }
      this.startTime = new Date(parsedTime);
    }
    this.playerIds = [];
    this.status = "Setup";
    const newButtons = await this.announcementBuildButtons();
    const newEmbeds = await this.announcementBuildEmbed();
    const message = {
      content: "A new league game has been announced!",
      embeds: [newEmbeds],
      components: [newButtons],
    };
    await channel.send(message);
    await interactionReply(this.interaction, `Command ran successfully! A new league game has been announced in ${channel}.`);
  }
  async handleButton(client, interaction) {
    this.interactionType = 'button';
    this.client = client;
    this.interaction = interaction;
    const customId = this.interaction.customId;
    if (customId === BUTTONID_SIGNUP) {
      this.signup();
    } else if (customId === BUTTONID_SIGNUPCANCEL) {
      this.signupCancel();
    } else if (customId === BUTTONID_GAMESTART) {
      this.gameStart();
    } else if (customId === BUTTONID_GAMECANCEL) {
      this.gameCancel();
    } else if (customId.startsWith("leaguegame_buy_")) {
      this.buyAbility();
    } else {
      await interactionReply(this.interaction, "Unknown button interaction");
    }
  }
  async announcementBuildButtons() {
    let buttons = new ActionRowBuilder()
    const allowSignup = this.status === "Setup" && this.playerIds.length <= this.playerCount;
    const allowSignupCancel = this.status === "Setup" || this.status === "Ready";
    const allowGameStart = this.status === "Ready";
    const allowGameCancel = this.status === "Setup" || this.status === "Ready";
    if (allowSignup) {
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(BUTTONID_SIGNUP)
          .setLabel("Sign Up")
          .setStyle(ButtonStyle.Primary)
      )
    }
    if (allowSignupCancel) {
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(BUTTONID_SIGNUPCANCEL)
          .setLabel("Cancel Sign Up")
          .setStyle(ButtonStyle.Danger)
      )
    }
    if (allowGameStart) {
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(BUTTONID_GAMESTART)
          .setLabel("Start Game")
          .setStyle(ButtonStyle.Primary)
      )
    }
    if (allowGameCancel) {
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(BUTTONID_GAMECANCEL)
          .setLabel("Cancel Game")
          .setStyle(ButtonStyle.Danger)
      )
    }
    if (buttons.components.length === 0) {
      buttons = null;
    }
    return buttons;
  }
  async announcementBuildEmbed() {
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
      timestamp: this.timestamp.toISOString(),
    };
    if (this.startTime != null) {
      // convert to <t:UnixTimestamp:F> format
      const unixTimestamp = Math.floor(this.startTime.getTime() / 1000);
      embed.fields.push({
        name: "Start Time",
        value: `<t:${unixTimestamp}:F>`,
      });
    }
    await this.resolvePlayerIds();
    for (let i = 1; i <= this.playerCount; i++) {
      let playerField = {
        name: `Player ${i}`,
        value: this.players[i - 1] ? `${this.players[i - 1]}` : "open",
        inline: true,
      };
      embed.fields.push(playerField);
    }
    return embed;
  }
  async signup() {
    await this.initFromAnnouncement()
    const message = this.interaction.message;
    let embeds = message.embeds;
    const fields = embeds[0].fields;

    // check that the user isn't the host
    // allow the host to sign up as a player (multiple times) in dev environment for testing if this is dev and they are a developer
    const isDev = this.client.config.devs.includes(this.interaction.user.id);
    const isProduction = this.client.config.isProduction;
    if (this.host.id === `${this.interaction.user.id}` && isProduction && !isDev) {
      await interactionReply(this.interaction, "You are the host of this game and cannot sign up as a player.");
      return;
    }
    // check that user is not already signed up
    const alreadySignedUp = this.playerIds.includes(`${this.interaction.user.id}`);
    if (alreadySignedUp && isProduction && !isDev) {
      await interactionReply(this.interaction, "You are already signed up for this game.");
      return;
    }
    // check that the game is in setup status
    if (this.status !== "Setup") {
      await interactionReply(this.interaction, "This game is not in a state that allows signing up.");
      return;
    }
    // check that there is an open slot
    if (this.playerIds.length >= this.playerCount) {
      await interactionReply(this.interaction, "No open slots available.");
      return;
    }
    // Register the user as a player
    this.playerIds.push(`${this.interaction.user.id}`);
    // check if the game is now full
    let gameFull = this.playerIds.length >= this.playerCount;
    if (gameFull) {
      this.status = "Ready";
    }
    const newButtons = await this.announcementBuildButtons();
    const newEmbeds = await this.announcementBuildEmbed();
    message.edit({
      embeds: [newEmbeds],
      components: [newButtons],
    });
    await interactionReply(this.interaction, `You have signed up for the game!`);
    if (gameFull) {
      await this.host.send(`Game ID ${this.gameId} is ready to start!`);
    }
  }
  async signupCancel() {
    await this.initFromAnnouncement()
    const message = this.interaction.message;
    // User must be signed up to cancel
    const alreadySignedUp = this.playerIds.includes(`${this.interaction.user.id}`);
    if (!alreadySignedUp) {
      await interactionReply(this.interaction, "You are not signed up for this game.");
      return;
    }
    // game must be in setup or ready status
    if (this.status !== "Setup" && this.status !== "Ready") {
      await interactionReply(this.interaction, "This game is not in a state that allows cancelling sign up.");
      return;
    }
    // Remove the user from the playerIds array and free up their slot
    this.playerIds = this.playerIds.filter(
      (id) => id !== `${this.interaction.user.id}`
    );
    // if the game was full, change it back to setup
    const oldStatus = this.status;
    this.status = "Setup";
    // update the announcement
    const newButtons = await this.announcementBuildButtons();
    const newEmbeds = await this.announcementBuildEmbed();
    message.edit({
      embeds: [newEmbeds],
      components: [newButtons],
    });
    // notify the host if the game was ready
    if (oldStatus === "Ready") {
      await this.host.send(`Player ${this.interaction.user.username} has cancelled their sign up for game ID ${this.gameId}. The game is no longer ready to start.`);
    }
    await interactionReply(this.interaction, `You have cancelled your sign up for the game.`);
  }
  async resolvePlayerIds() {
    // resolve the playerIds to user objects
    let playerResolveError = null;
    let players = [];
    for (const playerId of this.playerIds) {
      let player = this.client.users.cache.get(playerId);
      if (!player) {
        player = await this.client.users
          .fetch(playerId)
          .catch(() => null);
      }
      if (!player) {
        playerResolveError = playerId;
        console.error(`Player with ID ${playerId} not found.`);
        break;
      }
      players.push(player);
    }
    if (playerResolveError) {
      await interactionReply(this.interaction, `Error resolving player with ID ${playerResolveError}. Please try again later.`);
      throw new Error(`Player with ID ${playerResolveError} not found.`);
    }
    this.players = players;
  }
  async gameStart() {
    await this.initFromAnnouncement()
    const message = this.interaction.message;
    let embeds = message.embeds;
    const fields = embeds[0].fields;
    let statusField = fields.find((field) => field.name === "Status");
    // check that the user is the host
    if (this.host.id !== `${this.interaction.user.id}`) {
      await interactionReply(this.interaction, "You are not the host of this game.");
      return;
    }
    // check that the game is not already cancelled or started
    if (this.status !== "Ready") {
      await interactionReply(this.interaction, "This game is not ready to start or already started.");
      return;
    }
    // check that the game is full
    if (this.playerIds.length < this.playerCount) {
      await interactionReply(this.interaction, "This game is not full yet.");
      return;
    }
    // resolve the playerIds to user objects (this.players)
    await this.resolvePlayerIds();
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
    await interactionReply(this.interaction, "The game has started! Players have been notified.");
  }
  async gameCancel() {
    await this.initFromAnnouncement()
    const message = this.interaction.message;
    let embeds = message.embeds;
    let fields = embeds[0].fields;
    let statusField = fields.find((field) => field.name === "Status");
    // check that the user is the host
    if (this.host.id !== `${this.interaction.user.id}`) {
      await interactionReply(this.interaction, "You are not the host of this game.");
      return;
    }
    // check that the game is not already cancelled or started
    if (this.status !== "Ready" && this.status !== "Setup") {
      await interactionReply(this.interaction, "This game is not in a state that can be cancelled.");
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
    await interactionReply(this.interaction, "The game has been cancelled.");
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
        //"If you have credits you can purchase them using the buttons below.",
        "Game host will send you a DM with your abilities.",
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
  async buyAbility() {
    await this.initFromPlayerDM()
    // get credits from fields
    let message = this.interaction.message;
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
      this.interaction.customId === BUTTONID_BUY_SABOTAGECOMMS
    ) {
      abilityCost = 250;
      ability = "Sabotage Comms";
    } else if (
      this.interaction.customId === BUTTONID_BUY_ASSASSINATE
    ) {
      abilityCost = 500;
      ability = "Assassinate";
    } else if (
      this.interaction.customId === BUTTONID_BUY_CONFIRMEJECTION
    ) {
      abilityCost = 250;
      ability = "Confirm Ejection";
    } else if (
      this.interaction.customId === BUTTONID_BUY_SHERIFF
    ) {
      abilityCost = 500;
      ability = "Sheriff";
    } else {
      await interactionReply(this.interaction, "Unknown ability.");
      return;
    }
    // check if user has enough credits
    if (credits < abilityCost) {
      await interactionReply(this.interaction, `You do not have enough credits to buy ${ability}.`);
      return;
    }
    credits -= abilityCost;
    // send the host a DM
    await this.host.send(
      `${this.interaction.user.username} has purchased ${ability} for ${abilityCost} credits in game ID ${this.gameId}.`
    );
    creditsField.value = `${credits}`;
    // update the embed, remove components
    message.edit({
      embeds: embeds,
      components: [],
    });
    // reply to the user
    await interactionReply(this.interaction, `You have purchased ${ability} for ${abilityCost} credits.`);
  }
}
