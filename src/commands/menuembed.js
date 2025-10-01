const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { scrapeMenu } = require('../utils/scraper');

function formatMenu(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const menu = [];
  let currentChain = null;

  for (const line of lines) {
    if (/^•\s*CHAINE/i.test(line)) {
      // Nouvelle chaîne
      if (currentChain) menu.push(currentChain);
      currentChain = { title: line.replace(/^•\s*/, ''), items: [] };
    } else {
      if (currentChain) {
        currentChain.items.push(line.replace(/^•\s*/, ''));
      }
    }
  }

  if (currentChain) menu.push(currentChain);
  return menu;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menuembed')
    .setDescription('Affiche le menu du jour dans un embed structuré'),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const url = process.env.RESTO_URL;
      if (!url) return interaction.editReply('❌ RESTO_URL manquant dans le .env');

      const { text, image } = await scrapeMenu(url);
      if (!text) return interaction.editReply('⚠️ Impossible de trouver le menu.');

      const structured = formatMenu(text);

      const embed = new EmbedBuilder()
        .setTitle('📅 Menu du jour')
        .setColor(0x00a86b)
        .setTimestamp();

      if (image) embed.setThumbnail(image);

      for (const chain of structured) {
        embed.addFields({
          name: chain.title,
          value: chain.items.length ? chain.items.map(i => `- ${i}`).join('\n') : '_Aucun plat trouvé_',
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Erreur lors du scraping du menu.');
    }
  }
};
