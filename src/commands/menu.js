const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { scrapeMenu } = require('../utils/scraper');

function formatMenu(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const menu = [];
  let currentChain = null;

  for (const line of lines) {
    // Capture CHAINE X ou CHAINE MAC X + son nom
    const match = line.match(/^•?\s*(CHAINE(?:\s*MAC)?\s*\d+\s*:?)\s*(Traditionnelle|friterie|Entrée \/ plat en barquette à réchauffer \/ dessert)?/i);

    if (match) {
      if (currentChain) menu.push(currentChain);

      // Compose title with chain and type if present
      const title = match[1].trim() + (match[2] ? ` ${match[2].trim()}` : '');
      currentChain = { title, items: [] };
      continue;
    }

    // Split line into items, handling "Ou"/"ou" and "Accompagnés de"
    let item = line.replace(/^•\s*/, '').trim();

    // Replace "Ou"/"ou" with "ou" and split if needed
    if (/^Ou\b/i.test(item)) {
      item = item.replace(/^Ou\b/i, 'ou');
    }

    // Split "StrogonoffOuAiguillette blé emmental" to "Strogonoff ou aiguillette blé emmental"
    item = item.replace(/([a-zéèêîôûàâäëïöüç])Ou([A-ZÉÈÊÎÔÛÀÂÄËÏÖÜÇ])/g, '$1 ou $2');

    // Split "Accompagnés de coquillettes, piperade" to separate items
    if (/^Accompagnés de\b/i.test(item)) {
      const parts = item.replace(/^Accompagnés de\b/i, '').split(',');
      parts.forEach(p => currentChain && currentChain.items.push(p.trim()));
      continue;
    }

    // // Add separator for clarity if needed
    // if (/^Desserts lactés ou fruits$/i.test(item) || /^Entrées variées$/i.test(item)) {
    //   if (currentChain && currentChain.items.length) currentChain.items.push('');
    // }

    if (currentChain) currentChain.items.push(item);
  }

  if (currentChain) menu.push(currentChain);
  return menu;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Affiche le menu d\'un jour choisi'),
  
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const url = process.env.RESTO_URL;
      if (!url) return interaction.editReply('❌ RESTO_URL manquant dans le .env');

      // Choix de la date
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const dateOptions = [
        { label: `Aujourd'hui (${today.toLocaleDateString('fr-FR')})`, value: today.toISOString().split('T')[0] },
        { label: `Demain (${tomorrow.toLocaleDateString('fr-FR')})`, value: tomorrow.toISOString().split('T')[0] },
      ];

      const rowDate = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_date')
          .setPlaceholder('📅 Choisis le jour du menu')
          .addOptions(dateOptions)
      );

      await interaction.editReply({ content: 'Choisis un jour pour voir le menu :', components: [rowDate] });

      const dateSelection = await interaction.channel.awaitMessageComponent({
        filter: i => i.customId === 'select_date' && i.user.id === interaction.user.id,
        componentType: ComponentType.StringSelect,
        time: 20000
      });

      const chosenDate = dateSelection.values[0];
      await dateSelection.deferUpdate();

      // Scraping du menu
      const { text, image } = await scrapeMenu(url, chosenDate);
      if (!text) return interaction.editReply('⚠️ Impossible de trouver le menu.');

      const structured = formatMenu(text);

      const embed = new EmbedBuilder()
        .setTitle(`📅 Menu du ${chosenDate}`)
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

      await interaction.editReply({ content: null, embeds: [embed], components: [] });

    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Erreur lors du scraping du menu.');
    }
  }
};
