const axios = require('axios');
const cheerio = require('cheerio');
const urlModule = require('url');
import axiosRetry from "axios-retry";

axiosRetry(axios, {
  retries: 5,               // Jusqu'à 5 tentatives
  retryDelay: retryCount => retryCount * 2000 // attendre 2s, 4s, 6s...
});

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cache = {
  timestamp: 0,
  text: null,
  image: null
};

async function fetchHtml(url) {
  const resp = await axios.get(url, {
    timeout: 15000, // 15 secondes
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language': 'fr-FR,fr;q=0.9'
    }
  });

  return resp.data;
}

function absoluteUrl(base, maybeRelative) {
  try {
    return new urlModule.URL(maybeRelative, base).href;
  } catch {
    return maybeRelative;
  }
}

/**
 * Récupère le menu textuel et une image éventuelle.
 * Retourne { text: string | null, image: string | null }
 */
async function scrapeMenu(baseUrl) {
  const now = Date.now();
  if (now - cache.timestamp < CACHE_TTL_MS && cache.text) {
    return { text: cache.text, image: cache.image };
  }

  const html = await fetchHtml(baseUrl);
  const $ = cheerio.load(html);

  // Tentative heuristique : séléctionner bloc(s) contenant "menu", "Repas" ou blocs communs
  // On essaye d'abord la structure probable (obtenue à partir d'implémentations typiques)
  let textResult = "";
  let imageUrl = null;

  // 1) Rechercher des blocs "menu-day" ou article structure
  const menuCandidates = $('.menu-day, .menu, .entry-content, .single-content, .post-content');
  if (menuCandidates.length) {
    const first = menuCandidates.first();

    // récupérer les titres et paragraphes
    first.find('h1,h2,h3,h4').each((i, el) => {
      const t = $(el).text().trim();
      if (t) textResult += `**${t}**\n`;
    });
    first.find('p,li').each((i, el) => {
      const t = $(el).text().trim();
      if (t) textResult += `• ${t}\n`;
    });

    // image éventuelle dans ce bloc
    const img = first.find('img').first();
    if (img && img.attr('src')) {
      imageUrl = absoluteUrl(baseUrl, img.attr('src'));
    }
  }

  // 2) si rien, tenter une récupération plus brute
  if (!textResult) {
    // prendre le texte de l'élément principal
    const main = $('main, .content, #content').first();
    if (main.length) {
      main.find('h1,h2,h3').each((i, el) => {
        const t = $(el).text().trim();
        if (t) textResult += `**${t}**\n`;
      });
      main.find('p,li').each((i, el) => {
        const t = $(el).text().trim();
        if (t.length > 3) textResult += `• ${t}\n`;
      });
      const img = main.find('img').first();
      if (img && img.attr('src')) imageUrl = absoluteUrl(baseUrl, img.attr('src'));
    }
  }

  // 3) fallback : chercher la première image générale
  if (!imageUrl) {
    const anyImg = $('img').first();
    if (anyImg && anyImg.attr('src')) imageUrl = absoluteUrl(baseUrl, anyImg.attr('src'));
  }

  textResult = textResult ? textResult.trim() : null;

  // mettre en cache
  cache = {
    timestamp: now,
    text: textResult,
    image: imageUrl
  };

  return { text: textResult, image: imageUrl };
}

module.exports = {
  scrapeMenu
};
