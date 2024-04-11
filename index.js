const { Client, Events, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Define roles that are allowed to create polls
const allowedRoles = ["ROLE_ID1", "ROLE_ID2"]; // Replace RoleID1, RoleID2 with actual role IDs

// Define whitelisted servers
const whitelistedServers = ["SERVER_ID1", "SERVER_ID2"]; // Replace ServerID1, ServerID2 with actual server IDs

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  // Check each server the bot is part of
  client.guilds.cache.forEach((guild) => {
    if (!whitelistedServers.includes(guild.id)) {
      console.log(`Leaving non-whitelisted server: ${guild.name}`);
      guild.leave();
    }
  });
});

client.on(Events.Raw, async (packet) => {
  // Process polls creation
  if (packet.d.poll) {
    const channel = await client.channels.fetch(packet.d.channel_id);

    if (!channel || !channel.isTextBased()) {
      console.log("Channel not found");
      return;
    }

    const message = await channel.messages.fetch(packet.d.id).catch(() => console.log("Message not found"));

    if (message) {
      // Check if the message author has an allowed role
      const member = await message.guild.members.fetch(message.author.id);
      const hasAllowedRole = member.roles.cache.some((role) => allowedRoles.includes(role.id));

      if (!hasAllowedRole) {
        await message.reply(`${message.author}, polls are not allowed in this server.`).catch((err) => console.log("Error replying to message: ", err));
        await message.delete().catch((err) => console.log("Error deleting message: ", err));
      }
    }
  }
});

client.login(process.env.TOKEN);
