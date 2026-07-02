/* ════════════════════════════════════════════════
   data.js — Données statiques du jeu
   Brawlers + Variantes
════════════════════════════════════════════════ */

/*
  rarity : 'common' | 'rare' | 'super-rare' | 'epic'
  Commun     → Shelly
  Rare       → Rosa, Poco, El Primo, Brock, Colt, Nita, Bull, Barley
  Super Rare → Jessie, Rico, Dyna, Gus, Penny, Carl, Jacky, Darryl, Tick, Arkad
  Épique     → Bo, Piper, Pam, Frank, Bibi (plus dur à obtenir que toutes les Super Rare)
*/

const RARITIES = {
  'common':     { label: 'Commun',     couleur: '#94a3b8', bgCss: 'rgba(148,163,184,.12)', borderCss: 'rgba(148,163,184,.35)' },
  'rare':       { label: 'Rare',       couleur: '#22c55e', bgCss: 'rgba(34,197,94,.12)',   borderCss: 'rgba(34,197,94,.40)'   },
  'super-rare': { label: 'Super Rare', couleur: '#3b82f6', bgCss: 'rgba(59,130,246,.14)',  borderCss: 'rgba(59,130,246,.45)'  },
  'epic':       { label: 'Épique',     couleur: '#c026d3', bgCss: 'rgba(192,38,211,.14)',  borderCss: 'rgba(192,38,211,.5)'   },
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

  /* ── Épique ── (plus dur à obtenir que toutes les Super Rare, mais rapportent beaucoup plus) */
  { id:20, nom:"Bo",       div:5000,  couleur:"#c026d3", emoji:"🏹", img:"BoNormal.webp",     cpsBase:45,  sellValue:36, bgClass:"rarity-bg-epic", rarity:"epic", role:"poke"    },
  { id:21, nom:"Piper",    div:6500,  couleur:"#c026d3", emoji:"🌂", img:"PiperNormal.webp",  cpsBase:55,  sellValue:44, bgClass:"rarity-bg-epic", rarity:"epic", role:"poke"    },
  { id:22, nom:"Pam",      div:8000,  couleur:"#c026d3", emoji:"🛠️", img:"PamNormal.webp",    cpsBase:68,  sellValue:54,  bgClass:"rarity-bg-epic", rarity:"epic", role:"soutien" },
  { id:23, nom:"Frank",    div:10000, couleur:"#c026d3", emoji:"🔨", img:"FrankNormal.webp",  cpsBase:85,  sellValue:68,  bgClass:"rarity-bg-epic", rarity:"epic", role:"tank"    },
  { id:24, nom:"Bibi",     div:13000, couleur:"#c026d3", emoji:"⚾", img:"BibiNormal.webp",   cpsBase:105, sellValue:84,  bgClass:"rarity-bg-epic", rarity:"epic", role:"burst"   },
  { id:25, nom:"Bea",      div:15000, couleur:"#c026d3", emoji:"🐝", img:"BeaNormal.webp",    cpsBase:120, sellValue:96,  bgClass:"rarity-bg-epic", rarity:"epic", role:"poke"    },
  { id:26, nom:"Nani",     div:17000, couleur:"#c026d3", emoji:"🤖", img:"NaniNormal.webp",   cpsBase:138, sellValue:110, bgClass:"rarity-bg-epic", rarity:"epic", role:"poke"    },
  { id:27, nom:"Gale",     div:18500, couleur:"#c026d3", emoji:"🌬️", img:"GaleNormal.webp",   cpsBase:150, sellValue:120, bgClass:"rarity-bg-epic", rarity:"epic", role:"burst"   },
  { id:28, nom:"Emz",      div:20000, couleur:"#c026d3", emoji:"💇", img:"EmzNormal.webp",    cpsBase:165, sellValue:132, bgClass:"rarity-bg-epic", rarity:"epic", role:"burst"   },
  { id:29, nom:"Colette",  div:22000, couleur:"#c026d3", emoji:"🖤", img:"ColetteNormal.webp", cpsBase:182, sellValue:146, bgClass:"rarity-bg-epic", rarity:"epic", role:"burst"   },
];

/* FIX perf : BRAWLERS trié du plus rare (div élevé) au plus commun,
   précalculé UNE SEULE FOIS ici plutôt que refait à chaque appel de
   effectuerTirage() (roll.js) et _tirageHorsLigne() (offline.js) via
   `[...BRAWLERS].sort(...)`. Cet ordre est constant (BRAWLERS ne change
   jamais après le chargement), donc le retrier à chaque roll — et jusqu'à
   6000 fois d'affilée lors du calcul de la progression hors-ligne au
   chargement — était un travail répété pour rien, avec un vrai risque de
   freeze de l'UI au retour d'une longue absence. */
const BRAWLERS_PAR_RARETE_DESC = [...BRAWLERS].sort((a, b) => b.div - a.div);

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
    `onload="var el=document.getElementById('${id}');if(el){var s=el.querySelector('span');if(s)s.style.display='none'}" ` +
    `onerror="this.style.display='none';var el=document.getElementById('${id}');if(el){var fb=el.querySelector('span');if(fb)fb.style.display='inline'}">` +
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
  normal:     { label:"Normal",     badge:"badge-normal",     emoji:"",   chanceMult:1,     cpsMult:1,   sellMult:1   },
  shiny:      { label:"Shiny",      badge:"badge-shiny",      emoji:"✦",  chanceMult:15,    cpsMult:2,   sellMult:3   },
  golden:     { label:"Golden",     badge:"badge-golden",     emoji:"★",  chanceMult:100,   cpsMult:5,   sellMult:8   },
  rainbow:    { label:"Rainbow",    badge:"badge-rainbow",    emoji:"🌈", chanceMult:500,   cpsMult:12,  sellMult:20  },
  /* Monochrome : 33x plus dur à obtenir qu'un Rainbow (500 × 33), mais rapporte 10x plus d'argent */
  monochrome: { label:"Monochrome", badge:"badge-monochrome", emoji:"◐",  chanceMult:16500, cpsMult:120, sellMult:200 },
};

const ORDRE_VARIANTES = ['monochrome', 'rainbow', 'golden', 'shiny', 'normal'];

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
  richesse: {
    cout:       10_000,
    devise:     'gemmes',     // ← se paie en Gemmes, pas en Pièces
    duree:      3_600_000,    // 1 heure
    doubleMult: 2,
    label:      "Potion de Richesse",
    color:      "#22c55e",
    barId:      "richesseBar",
  },
};

/* ── Helper : génère le HTML d'image d'un brawler ──
   size    : classe CSS de taille (ex. "w-10 h-10")
   extra   : styles inline supplémentaires
   variante: si fournie, ajoute un outline de la couleur de la mutation  */
function brawlerImg(brawler, size = 'w-10 h-10', extra = '', variante = null) {
  let outlineStyle = '';
  if (variante === 'rainbow') {
    // Rainbow : outline animé via box-shadow multi-couleur rotatif
    // (outline ne supporte pas les dégradés, on simule avec un wrapper)
    outlineStyle = `
      outline: 2.5px solid transparent;
      border-radius: 6px;
      box-shadow: 0 0 0 2.5px #e879f9, 0 0 6px 1px #e879f9aa;
      animation: rainbowOutline 1.8s linear infinite;
    `;
  } else if (variante === 'monochrome') {
    // Monochrome : même principe que rainbow, mais l'outline oscille
    // entre le noir et le blanc au lieu de tourner dans les couleurs
    outlineStyle = `
      outline: 2.5px solid transparent;
      border-radius: 6px;
      box-shadow: 0 0 0 2.5px #ffffff, 0 0 6px 1px #ffffffaa;
      animation: monochromeOutline 1.8s linear infinite;
    `;
  } else if (variante && variante !== 'normal') {
    const color = couleurVariante(brawler, variante);
    outlineStyle = `outline: 2.5px solid ${color}; border-radius: 6px; box-shadow: 0 0 5px 0px ${color}88;`;
  } else if (variante === 'normal') {
    // Pas de mutation : simple outline blanc fixe
    outlineStyle = `outline: 2.5px solid #ffffff; border-radius: 6px; box-shadow: 0 0 5px 0px #ffffff55;`;
  }
  // Wrapper de taille fixe (${size}) qui centre l'image ; l'image elle-même
  // n'a pas de largeur/hauteur forcée (width/height:auto + max-width/max-height:100%)
  // afin qu'elle ne prenne QUE la taille réelle de son contenu visible une fois
  // le ratio respecté. L'outline étant posé sur l'<img> et non sur le wrapper,
  // il colle donc pile à la taille de l'image affichée, plus de gros carré vide.
  return `<span class="${size} inline-flex items-center justify-center overflow-visible" style="line-height:0;">
    <img src="${brawler.img}" alt="${brawler.nom}"
      style="display:block;width:auto;height:auto;max-width:100%;max-height:100%;image-rendering:auto;${outlineStyle}${extra}"
      onerror="this.style.display='none';this.insertAdjacentText('afterend','${brawler.emoji}')" />
  </span>`;
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
