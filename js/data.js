/* ════════════════════════════════════════════════
   data.js — Données statiques du jeu
   Brawlers + Variantes
════════════════════════════════════════════════ */

/*
  rarity : 'common' | 'rare' | 'super-rare'
  Commun     → Shelly
  Rare       → Rosa, Poco, El Primo, Brock, Colt, Nita, Bull, Barley
  Super Rare → Jessie, Rico, Dyna
*/

const RARITIES = {
  'common':     { label: 'Commun',     couleur: '#94a3b8', bgCss: 'rgba(148,163,184,.12)', borderCss: 'rgba(148,163,184,.35)' },
  'rare':       { label: 'Rare',       couleur: '#22c55e', bgCss: 'rgba(34,197,94,.12)',   borderCss: 'rgba(34,197,94,.40)'   },
  'super-rare': { label: 'Super Rare', couleur: '#3b82f6', bgCss: 'rgba(59,130,246,.14)',  borderCss: 'rgba(59,130,246,.45)'  },
};

const BRAWLERS = [
  /* ── Commun ── */
  { id:1,  nom:"Shelly",   div:5,    couleur:"#94a3b8", emoji:"🔫", img:"ShellyNormal.webp",  cpsBase:1,  sellValue:1,  bgClass:"rarity-bg-common",      rarity:"common"     },

  /* ── Rare ── */
  { id:2,  nom:"Colt",     div:12,   couleur:"#22c55e", emoji:"🤠", img:"ColtNormal.webp",    cpsBase:2,  sellValue:2,  bgClass:"rarity-bg-rare",        rarity:"rare"       },
  { id:3,  nom:"Nita",     div:25,   couleur:"#22c55e", emoji:"🐻", img:"NitaNormal.webp",    cpsBase:3,  sellValue:3,  bgClass:"rarity-bg-rare",        rarity:"rare"       },
  { id:4,  nom:"Poco",     div:50,   couleur:"#22c55e", emoji:"🎸", img:"PocoNormal.webp",    cpsBase:5,  sellValue:5,  bgClass:"rarity-bg-rare",        rarity:"rare"       },
  { id:5,  nom:"Barley",   div:100,  couleur:"#22c55e", emoji:"🍾", img:"BarleyNormal.webp",  cpsBase:8,  sellValue:7,  bgClass:"rarity-bg-rare",        rarity:"rare"       },
  { id:6,  nom:"Bull",     div:200,  couleur:"#22c55e", emoji:"🐂", img:"BullNormal.webp",    cpsBase:12, sellValue:10, bgClass:"rarity-bg-rare",        rarity:"rare"       },
  { id:7,  nom:"El Primo", div:400,  couleur:"#22c55e", emoji:"🥊", img:"PrimoNormal.webp",   cpsBase:18, sellValue:12, bgClass:"rarity-bg-rare",        rarity:"rare"       },
  { id:8,  nom:"Rosa",     div:800,  couleur:"#22c55e", emoji:"🌹", img:"RosaNormal.webp",    cpsBase:25, sellValue:15, bgClass:"rarity-bg-rare",        rarity:"rare"       },
  { id:9,  nom:"Brock",    div:300,  couleur:"#22c55e", emoji:"🚀", img:"BrockNormal.webp",   cpsBase:14, sellValue:11, bgClass:"rarity-bg-rare",        rarity:"rare"       },

  /* ── Super Rare ── */
  { id:10, nom:"Jessie",   div:500,  couleur:"#3b82f6", emoji:"⚡", img:"JessieNormal.webp",  cpsBase:22, sellValue:18, bgClass:"rarity-bg-super-rare",  rarity:"super-rare" },
  { id:11, nom:"Rico",     div:800,  couleur:"#3b82f6", emoji:"🎯", img:"RicoNormal.webp",    cpsBase:28, sellValue:22, bgClass:"rarity-bg-super-rare",  rarity:"super-rare" },
  { id:12, nom:"Dyna",     div:1200, couleur:"#3b82f6", emoji:"💣", img:"DynaNormal.webp",    cpsBase:35, sellValue:28, bgClass:"rarity-bg-super-rare",  rarity:"super-rare" },
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
  shiny: {
    cout:  100_000,
    duree: 5_000,
    label: "Potion de Shiny",
    color: "#38bdf8",
    barId: "shinyBar",
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

/* ── Helper : badge HTML de rareté ── */
function rarityBadge(rarity) {
  const r = RARITIES[rarity];
  if (!r) return '';
  return `<span style="
    font-size:.55rem;font-weight:900;text-transform:uppercase;letter-spacing:.07em;
    padding:.1rem .45rem;border-radius:4px;
    background:${r.bgCss};border:1px solid ${r.borderCss};color:${r.couleur};
    white-space:nowrap;">${r.label}</span>`;
}
