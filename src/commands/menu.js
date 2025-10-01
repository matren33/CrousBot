const { SlashCommandBuilder } = require('discord.js');
const { scrapeMenu } = require('../utils/scraper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Récupère et affiche le menu textuel du CROUS'),
  async execute(interaction) {
    await interaction.deferReply();
    try {
      const url = process.env.RESTO_URL;
      if (!url) return interaction.editReply('❌ RESTO_URL manquant dans le .env');

      const { text } = await scrapeMenu(url);
      if (!text) return interaction.editReply('⚠️ Impossible de trouver le menu textuel sur le site.');
      // Discord limite le message à ~2000 chars
      if (text.length > 1900) {
        // envoyer en plusieurs messages
        const chunked = text.match(/[\s\S]{1,1900}/g);
        await interaction.editReply(chunked.shift());
        for (const chunk of chunked) {
          await interaction.followUp(chunk);
        }
      } else {
        await interaction.editReply(text);
      }
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Erreur lors du scraping du menu.');
    }
  }
};
