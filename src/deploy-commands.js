require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error("❌ DISCORD_TOKEN et CLIENT_ID requis dans .env");
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`🚀 Déploiement de ${commands.length} commandes...`);

    if (guildId) {
      // déploie dans une guild pour tests instantanés
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log('✅ Commandes déployées dans la guild (dev).');
    } else {
      // déploiement global (peut prendre ~1h)
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('✅ Commandes déployées globalement.');
    }
  } catch (err) {
    console.error(err);
  }
})();
