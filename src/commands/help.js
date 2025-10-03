const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Affiche les commandes disponibles'),
  async execute(interaction) {
    const cmds = [
      '/help - Affiche cette aide',
      '/menu - Affiche le menu avec le choix du jour',
      '/ping - Test de latence'
    ].join('\n');
    await interaction.reply({ content: `📚 **Commandes:**\n${cmds}`, ephemeral: true });
  }
};
