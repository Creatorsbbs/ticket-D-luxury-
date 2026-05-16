const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("painel")
    .setDescription("Abre o painel de tickets"),

  new SlashCommandBuilder()
    .setName("forca")
    .setDescription("Inicia uma partida de forca multiplayer"),

  new SlashCommandBuilder()
    .setName("setstaff")
    .setDescription("Define o cargo de staff do servidor")
    .addRoleOption(option =>
      option
        .setName("cargo")
        .setDescription("Selecione o cargo de staff")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("📦 Registrando comandos...");

    await rest.put(
  Routes.applicationGuildCommands(
    process.env.CLIENT_ID,
    process.env.GUILD_ID
  ),
  { body: commands }
);

    console.log("✅ Comandos registrados com sucesso!");
  } catch (err) {
    console.log("❌ Erro ao registrar comando:", err);
  }
})();
