# 🍽️ Bot CROUS Menu (Discord.js)

Un bot Discord qui scrape le menu CROUS et l’affiche.

## 🚀 Fonctionnalités

- Commande `/help` :
  - Affichage de l'aide
- Commande `/menu` :
  - Sélection du **jour** du menu (aujourd’hui, demain, etc.)
  - Sélection de la **file (CHAINE 1, CHAINE 2, CHAINE 3, CHAINE MAC 4)**
  - Affichage structuré et clair via un **Embed Discord**
- Commande `/ping` :
  - Voir la latence du bot
- Configuration sécurisée via `.env`

## 📦 Installation

1. Clone le repo :

```bash
git clone https://github.com/ton-compte/CrousBot.git
cd CrousBot
```

2. Creation des fichier neccesaire :

Crée le fichier *.env* dans le repertoire racine

*.env* :
- DISCORD_TOKEN (Token de votre bot discord)
- CLIENT_ID (L'ID de votre bot)
- GUILD_ID (L'ID de votre serveur discord pour le setup des commandes)
- RESTO_URL (ex: RESTO_URL=https://www.crous-bordeaux.fr/restaurant/resto-u-n2-3/)

```bash
npm install dotenv
```

3. Setup des commandes :

```bash
npm run deploy-commands
```

4. Lancer le bot :

dans le repertoire racine :
```bash
node .\src\index.js
```
