const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Affiche les commandes disponibles'),
  async execute(interaction) {
    const cmds = [
      '/menu — Affiche le menu textuel du jour',
      '/menuphoto — Affiche la photo du menu si disponible',
      '/menuembed — Affiche le menu dans un embed',
      '/ping — Test de latence'
    ].join('\n');
    await interaction.reply({ content: `📚 **Commandes:**\n${cmds}`, ephemeral: true });
  }
};
