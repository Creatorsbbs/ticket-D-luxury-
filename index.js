const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const { QuickDB } = require("quick.db");
const db = new QuickDB();

// ================= DADOS =================
const ticketOwners = new Map();
const ticketData = new Map();

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

require("./forca")(client);

// ================= START =================
client.once("clientReady", async () => {
  console.log(`🤖 Online como ${client.user.tag}`);
  client.guilds.cache.forEach(guild => setupServer(guild));
});

// ================= AUTO SETUP =================
async function setupServer(guild) {
  try {

    let staffRoleId = await db.get(`staffRole_${guild.id}`);

    if (!staffRoleId) {
      staffRoleId = "1491095314550100100";
    }

    let staffRole = staffRoleId ? guild.roles.cache.get(staffRoleId) : null;

    let openLogs = guild.channels.cache.find(c => c.name === "📂・tickets-abertos");

    if (!openLogs) {
      openLogs = await guild.channels.create({
        name: "📂・tickets-abertos",
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          {
            id: guild.members.me.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ManageChannels
            ]
          },
          ...(staffRole ? [{
            id: staffRole.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }] : [])
        ]
      });
    }

    let closeLogs = guild.channels.cache.find(c => c.name === "🔒・tickets-fechados");

    if (!closeLogs) {
      closeLogs = await guild.channels.create({
        name: "🔒・tickets-fechados",
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          {
            id: guild.members.me.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ManageChannels
            ]
          },
          {
            id: "1491095314550100100",
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          },
          ...(staffRole ? [{
            id: staffRole.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }] : [])
        ]
      });
    }

    let ticketCategory = guild.channels.cache.find(
      c => c.name === "🎫 TICKETS" && c.type === ChannelType.GuildCategory
    );

    if (!ticketCategory) {
      ticketCategory = await guild.channels.create({
        name: "🎫 TICKETS",
        type: ChannelType.GuildCategory
      });
    }

  } catch (err) {
    console.log("Erro setup:", err);
  }
}

// ================= PAINEL (CORRIGIDO SEM REMOVER NADA) =================
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  if (message.content.toLowerCase() !== "painel") return;

  try {

    const embed = new EmbedBuilder()
      .setTitle("🎫 CENTRAL DE ATENDIMENTO")
      .setThumbnail("https://cdn.discordapp.com/attachments/1264564541979627604/1504187640524701726/file_000000005270720e895d4916721bd3ce.png")
      .setDescription(`
Aqui você pode abrir um atendimento de forma rápida e organizada.

💬 Suporte
💰 Vendas
🚨 Denúncia
🤝 Parceria
`)
      .setImage("https://cdn.discordapp.com/attachments/1264564541979627604/1504187640524701726/file_000000005270720e895d4916721bd3ce.png")
      .setColor("#00b0f4");

    const row = new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId("ticket_suporte")
        .setLabel("💬 Suporte")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("ticket_vendas")
        .setLabel("💰 Vendas")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("ticket_denuncia")
        .setLabel("🚨 Denúncia")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("ticket_parceria")
        .setLabel("🤝 Parceria")
        .setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({
      embeds: [embed],
      components: [row]
    });

  } catch (err) {
    console.log("Erro painel:", err);
  }
});

// ================= TICKETS =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const user = interaction.user;

  const staffRoleId = await db.get(`staffRole_${guild.id}`);
  const staffRole = staffRoleId ? guild.roles.cache.get(staffRoleId) : null;

  async function createTicket(type) {

    try {

      await interaction.deferReply({ flags: 64 });

      const category = guild.channels.cache.find(
        c => c.name === "🎫 TICKETS" && c.type === ChannelType.GuildCategory
      );

      if (!category) {
        return interaction.editReply({
          content: "❌ Categoria de tickets não encontrada."
        });
      }

      const channel = await guild.channels.create({
        name: `🎫-${type}-${user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        type: ChannelType.GuildText,
        parent: category.id,

        permissionOverwrites: [
          { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          {
            id: user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          },
          ...(staffRole ? [{
            id: staffRole.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }] : [])
        ]
      });

      ticketOwners.set(channel.id, user.id);
      ticketData.set(channel.id, {
        createdAt: new Date(),
        messages: 0,
        users: new Set([user.id])
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket ${type}`)
        .setColor("#00b0f4");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("call_staff")
          .setLabel("🔔 Chamar Staff")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("notify_client")
          .setLabel("📨 Notificar Cliente")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("🔒 Fechar")
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        content: `<@${user.id}>`,
        embeds: [embed],
        components: [row]
      });

      return interaction.editReply({
        content: `✅ Ticket criado: ${channel}`
      });

    } catch (err) {
      console.log("Erro ticket:", err);
      return interaction.editReply({
        content: "❌ Erro ao criar ticket."
      });
    }
  }

  if (interaction.customId === "ticket_suporte") return createTicket("suporte");
  if (interaction.customId === "ticket_vendas") return createTicket("vendas");
  if (interaction.customId === "ticket_denuncia") return createTicket("denuncia");
  if (interaction.customId === "ticket_parceria") return createTicket("parceria");
});

// ================= CONTADOR =================
client.on("messageCreate", (message) => {
  if (!message.guild) return;

  const data = ticketData.get(message.channel.id);
  if (!data) return;

  data.messages++;

  if (!data.users.has(message.author.id)) {
    data.users.add(message.author.id);
  }
});

// ================= ERROS =================
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// ================= EXPRESS =================
const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot online!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor online"));

// ================= LOGIN =================
client.login(process.env.TOKEN);
