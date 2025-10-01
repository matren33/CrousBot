const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { scrapeMenu } = require('../utils/scraper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menuphoto')
    .setDescription('Affiche la photo du menu si disponible'),
  async execute(interaction) {
    await interaction.deferReply();
    try {
      const url = process.env.RESTO_URL;
      if (!url) return interaction.editReply('❌ RESTO_URL manquant dans le .env');
      const { image } = await scrapeMenu(url);
      if (!image) return interaction.editReply('⚠️ Aucune image trouvée sur la page.');

      const embed = new EmbedBuilder()
        .setTitle('Menu du jour (image)')
        .setImage(image)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Erreur lors de la récupération de l\'image.');
    }
  }
};
