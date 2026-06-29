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
  { id:1,  nom:"Shelly",   div:5,    couleur:"#94a3b8", emoji:"🔫", img:"ShellyNormal.webp",  cpsBase:1,  sellValue:1,  bgClass:"rarity-bg-common",      rarity:"common",     role:"burst"   },

  /* ── Rare ── */
  { id:2,  nom:"Colt",     div:12,   couleur:"#22c55e", emoji:"🤠", img:"ColtNormal.webp",    cpsBase:2,  sellValue:2,  bgClass:"rarity-bg-rare",        rarity:"rare",       role:"burst"   },
  { id:3,  nom:"Nita",     div:25,   couleur:"#22c55e", emoji:"🐻", img:"NitaNormal.webp",    cpsBase:3,  sellValue:3,  bgClass:"rarity-bg-rare",        rarity:"rare",       role:"tank"    },
  { id:4,  nom:"Poco",     div:50,   couleur:"#22c55e", emoji:"🎸", img:"PocoNormal.webp",    cpsBase:5,  sellValue:5,  bgClass:"rarity-bg-rare",        rarity:"rare",       role:"soutien" },
  { id:5,  nom:"Barley",   div:100,  couleur:"#22c55e", emoji:"🍾", img:"BarleyNormal.webp",  cpsBase:8,  sellValue:7,  bgClass:"rarity-bg-rare",        rarity:"rare",       role:"poke"    },
  { id:6,  nom:"Bull",     div:200,  couleur:"#22c55e", emoji:"🐂", img:"BullNormal.webp",    cpsBase:12, sellValue:10, bgClass:"rarity-bg-rare",        rarity:"rare",       role:"tank"    },
  { id:7,  nom:"El Primo", div:400,  couleur:"#22c55e", emoji:"🥊", img:"PrimoNormal.webp",   cpsBase:18, sellValue:12, bgClass:"rarity-bg-rare",        rarity:"rare",       role:"tank"    },
  { id:8,  nom:"Rosa",     div:800,  couleur:"#22c55e", emoji:"🌹", img:"RosaNormal.webp",    cpsBase:25, sellValue:15, bgClass:"rarity-bg-rare",        rarity:"rare",       role:"tank"    },
  { id:9,  nom:"Brock",    div:300,  couleur:"#22c55e", emoji:"🚀", img:"BrockNormal.webp",   cpsBase:14, sellValue:11, bgClass:"rarity-bg-rare",        rarity:"rare",       role:"poke"    },

  /* ── Super Rare ── */
  { id:10, nom:"Jessie",   div:900,  couleur:"#3b82f6", emoji:"⚡", img:"JessieNormal.webp",  cpsBase:22, sellValue:18, bgClass:"rarity-bg-super-rare",  rarity:"super-rare", role:"poke"    },
  { id:11, nom:"Rico",     div:1000, couleur:"#3b82f6", emoji:"🎯", img:"RicoNormal.webp",    cpsBase:28, sellValue:22, bgClass:"rarity-bg-super-rare",  rarity:"super-rare", role:"burst"   },
  { id:12, nom:"Dyna",     div:1200, couleur:"#3b82f6", emoji:"💣", img:"DynaNormal.webp",    cpsBase:35, sellValue:28, bgClass:"rarity-bg-super-rare",  rarity:"super-rare", role:"poke"    },
  { id:13, nom:"Gus",      div:1400, couleur:"#3b82f6", emoji:"👻", img:"GusNormal.webp",     cpsBase:26, sellValue:20, bgClass:"rarity-bg-super-rare",  rarity:"super-rare", role:"soutien" },
  { id:16, nom:"Penny",    div:1500, couleur:"#3b82f6", emoji:"🏴‍☠️", img:"PennyNormal.webp",  cpsBase:24, sellValue:19, bgClass:"rarity-bg-super-rare",  rarity:"super-rare", role:"poke"    },
  { id:18, nom:"Carl",     div:1700, couleur:"#3b82f6", emoji:"🪃", img:"CarlNormal.webp",    cpsBase:29, sellValue:23, bgClass:"rarity-bg-super-rare",  rarity:"super-rare", role:"tank"    },
  { id:14, nom:"Jacky",    div:1900, couleur:"#3b82f6", emoji:"⛏️", img:"JackyNormal.webp",   cpsBase:30, sellValue:24, bgClass:"rarity-bg-super-rare",  rarity:"super-rare", role:"tank"    },
  { id:19, nom:"Darryl",   div:2200, couleur:"#3b82f6", emoji:"🛢️", img:"DarrylNormal.webp",  cpsBase:31, sellValue:24, bgClass:"rarity-bg-super-rare",  rarity:"super-rare", role:"tank"    },
  { id:17, nom:"Tick",     div:2600, couleur:"#3b82f6", emoji:"💥", img:"TickNormal.webp",    cpsBase:33, sellValue:26, bgClass:"rarity-bg-super-rare",  rarity:"super-rare", role:"poke"    },
  { id:15, nom:"Arkad",    div:3200, couleur:"#3b82f6", emoji:"🕹️", img:"8bitNormal.webp",    cpsBase:32, sellValue:25, bgClass:"rarity-bg-super-rare",  rarity:"super-rare", role:"burst"   },
];

/* ════════════════════════════════════════════════
   Rôles de combat — triangle de contre (façon pierre-feuille-ciseaux)

     💥 Burst       contre  🛡️ Tank/Aggro   (×1.5 infligés / ×0.75 reçus)
     🛡️ Tank/Aggro  contre  🎯 Poke/Sniper  (×1.5 infligés / ×0.75 reçus)
     🎯 Poke/Sniper contre  💥 Burst        (×1.5 infligés / ×0.75 reçus)
     💚 Soutien     → toujours neutre (×1), mais peut soigner son équipe
════════════════════════════════════════════════ */
const ROLES = {
  tank:    { label:"Tank/Aggro",  emoji:"🛡️", couleur:"#ef4444", img:"Tanks.webp"    },
  poke:    { label:"Poke/Sniper", emoji:"🎯", couleur:"#38bdf8", img:"Pokes.webp"    },
  burst:   { label:"Burst",       emoji:"💥", couleur:"#f59e0b", img:"Bursts.webp"   },
  soutien: { label:"Soutien",     emoji:"💚", couleur:"#22c55e", img:"Soutiens.webp" },
};

/* ── Icône de rôle : petit logo en image ── */
function roleIcon(role, size = '16px', style = '') {
  const r = ROLES[role];
  if (!r) return '';
  const id = 'ri_' + Math.random().toString(36).slice(2, 7);
  return `<span id="${id}" style="display:inline-flex;align-items:center;justify-content:center;width:${size};height:${size};${style}">` +
    `<img src="./${r.img}" alt="${r.label}" ` +
    `style="width:100%;height:100%;object-fit:contain" ` +
    `onload="document.getElementById('${id}').querySelector('span')&&(document.getElementById('${id}').querySelector('span').style.display='none')" ` +
    `onerror="this.style.display='none';var fb=document.getElementById('${id}').querySelector('span');if(fb)fb.style.display='inline'">` +
    `<span style="display:none;font-size:calc(${size} * 0.75);line-height:1">${r.emoji}</span>` +
    `</span>`;
}

/* roleAttaquant → role qu'il contre */
const ROLE_COUNTERS = {
  burst: 'tank',
  tank:  'poke',
  poke:  'burst',
};

/* Multiplicateur de dégâts infligés par roleAttaquant à roleCible */
function multiplicateurRole(roleAttaquant, roleCible) {
  if (!roleAttaquant || !roleCible) return 1;
  if (roleAttaquant === 'soutien' || roleCible === 'soutien') return 1;
  if (ROLE_COUNTERS[roleAttaquant] === roleCible) return 1.5;
  if (ROLE_COUNTERS[roleCible] === roleAttaquant) return 0.75;
  return 1;
}

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
  wished: {
    cout:      670_000,
    duree:     67_000,
    speedMult: 6.7,
    label:     "Potion Wished",
    color:     "#f59e0b",
    barId:     "wishedBar",
  },
  golden: {
    cout:  5_000_000,
    duree: 10_000,
    label: "Potion Golden",
    color: "#fbbf24",
    barId: "goldenBar",
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
