require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { scrapeMenu } = require('./utils/scraper');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

function formatMenu(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const menu = [];
  let currentChain = null;

  for (const line of lines) {
    const match = line.match(/^•?\s*(CHAINE\s*\d+\s*:\s*[^•\d]+)(.*)$/i);

    if (match) {
      if (currentChain) menu.push(currentChain);

      const title = match[1].trim();
      const rest = match[2].trim();

      currentChain = { title, items: [] };

      if (rest) {
        // coupe proprement les phrases en évitant les mots collés
        const parts = rest.split(/(?<=\w)\s+(?=[A-ZÉÈÎÔÙÂÊÎÔÛ])/);
        currentChain.items.push(...parts.map(p => p.trim()));
      }
    } else if (currentChain) {
      currentChain.items.push(line.replace(/^•\s*/, '').trim());
    }
  }

  if (currentChain) menu.push(currentChain);
  return menu;
}

client.once('ready', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
  if (!channel) {
    console.error('❌ Salon introuvable');
    return process.exit(1);
  }

  try {
    const { text, image } = await scrapeMenu(process.env.RESTO_URL);
    if (!text) {
      await channel.send('⚠️ Impossible de trouver le menu du jour.');
      return process.exit(0);
    }

    const structured = formatMenu(text);

    const embed = new EmbedBuilder()
      .setTitle(`📅 Menu du ${new Date().toISOString().split('T')[0]}`)
      .setColor(0x00a86b)
      .setTimestamp();

    if (image) embed.setThumbnail(image);

    for (const chain of structured) {
      let value = chain.items.map(i => `- ${i}`).join('\n');
      if (value.length > 1024) value = value.slice(0, 1020) + '...';
      embed.addFields({ name: chain.title, value });
    }

    await channel.send({ embeds: [embed] });
    console.log('✅ Menu envoyé sur Discord');
  } catch (err) {
    console.error('Erreur lors de l’envoi du menu :', err);
  } finally {
    setTimeout(() => process.exit(0), 5000);
  }
});

client.login(process.env.DISCORD_TOKEN);
