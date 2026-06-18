/* ════════════════════════════════════════════════
   data.js — Données statiques du jeu
   Brawlers + Variantes
════════════════════════════════════════════════ */

const BRAWLERS = [
  { id:1, nom:"Shelly",   div:5,   couleur:"#94a3b8", emoji:"🔫", img:"ShellyNormal.webp",  cpsBase:1,  sellValue:1,  bgClass:"rarity-bg-1" },
  { id:2, nom:"Colt",     div:12,  couleur:"#22c55e", emoji:"🤠", img:"ColtNormal.webp",    cpsBase:2,  sellValue:2,  bgClass:"rarity-bg-2" },
  { id:3, nom:"Nita",     div:25,  couleur:"#3b82f6", emoji:"🐻", img:"NitaNormal.webp",    cpsBase:3,  sellValue:3,  bgClass:"rarity-bg-3" },
  { id:4, nom:"Poco",     div:50,  couleur:"#06b6d4", emoji:"🎸", img:"PocoNormal.webp",    cpsBase:5,  sellValue:5,  bgClass:"rarity-bg-4" },
  { id:5, nom:"Barley",   div:100, couleur:"#f59e0b", emoji:"🍾", img:"BarleyNormal.webp",  cpsBase:8,  sellValue:7,  bgClass:"rarity-bg-5" },
  { id:6, nom:"Bull",     div:200, couleur:"#f97316", emoji:"🐂", img:"BullNormal.webp",    cpsBase:12, sellValue:10, bgClass:"rarity-bg-6" },
  { id:7, nom:"El Primo", div:400, couleur:"#ec4899", emoji:"🥊", img:"PrimoNormal.webp",   cpsBase:18, sellValue:12, bgClass:"rarity-bg-7" },
  { id:8, nom:"Rosa",     div:800, couleur:"#c026d3", emoji:"🌹", img:"RosaNormal.webp",    cpsBase:25, sellValue:15, bgClass:"rarity-bg-8" },
];

/* chanceMult : diviseur supplémentaire sur la chance de base
   cpsMult    : multiplicateur pièces/s quand équipé
   sellMult   : multiplicateur prix de vente                 */
const VARIANTES = {
  normal:  { label:"Normal",  badge:"badge-normal",  emoji:"",   chanceMult:1,   cpsMult:1,   sellMult:1   },
  shiny:   { label:"Shiny",   badge:"badge-shiny",   emoji:"✦",  chanceMult:15,  cpsMult:2,   sellMult:3   },
  golden:  { label:"Golden",  badge:"badge-golden",  emoji:"★",  chanceMult:100, cpsMult:5,   sellMult:8   },
  rainbow: { label:"Rainbow", badge:"badge-rainbow", emoji:"🌈", chanceMult:500, cpsMult:12,  sellMult:20  },
};

const ORDRE_VARIANTES = ['rainbow', 'golden', 'shiny', 'normal'];

/* Potions */
const POTIONS = {
  luck: {
    cout:     250,
    duree:    30_000,
    luckMult: 2,
    label:    "Potion de Chance",
    color:    "#a855f7",
    barId:    "luckBar",
  },
  speed: {
    cout:      400,
    duree:     20_000,
    speedMult: 3,
    label:     "Potion de Vitesse",
    color:     "#38bdf8",
    barId:     "speedBar",
  },
};

/* ── Helper : génère le HTML d'image d'un brawler ──
   size  : classe CSS de taille (ex. "w-10 h-10")
   extra : styles inline supplémentaires              */
function brawlerImg(brawler, size = 'w-10 h-10', extra = '') {
  return `<img src="${brawler.img}" alt="${brawler.nom}"
    class="${size} object-contain"
    style="image-rendering:auto;${extra}"
    onerror="this.style.display='none';this.insertAdjacentText('afterend','${brawler.emoji}')" />`;
}
