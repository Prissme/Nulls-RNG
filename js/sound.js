/* ════════════════════════════════════════════════
   sound.js — Gestionnaire de sons du jeu
   Utilise l'API Web Audio pour générer les sons
   procéduralement (pas de fichiers à héberger).
════════════════════════════════════════════════ */

const Sound = (() => {
  let ctx = null;
  let enabled = true;
  let volume = 0.4;

  /* ── Initialise le contexte audio (nécessite un geste utilisateur) ── */
  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  /* ── Nœud de volume master ── */
  function master() {
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(ctx.destination);
    return gain;
  }

  /* ── Joue une note synthétisée ──
     type   : 'sine' | 'square' | 'triangle' | 'sawtooth'
     freq   : fréquence en Hz
     dur    : durée en secondes
     delay  : délai de départ en secondes
     vol    : volume relatif (0-1) */
  function note(type, freq, dur, delay = 0, vol = 1) {
    if (!enabled || !ctx) return;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    g.connect(master());

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    osc.connect(g);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.05);
  }

  /* ── Bruit blanc (pour les effets percussifs) ── */
  function noise(dur, delay = 0, vol = 0.3) {
    if (!enabled || !ctx) return;
    const bufSize = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);

    src.connect(g);
    g.connect(master());
    src.start(ctx.currentTime + delay);
  }

  /* ════════════════════════════════════════════
     SONS DU JEU
  ════════════════════════════════════════════ */

  /* Roll normal — petit "click" + montée rapide */
  function roll() {
    init();
    noise(0.04, 0, 0.25);
    note('sine', 220, 0.08, 0,    0.6);
    note('sine', 440, 0.12, 0.05, 0.4);
  }

  /* Roll Shiny — son cristallin */
  function shiny() {
    init();
    note('sine', 880,  0.15, 0,    0.7);
    note('sine', 1320, 0.2,  0.05, 0.6);
    note('sine', 1760, 0.25, 0.1,  0.5);
    note('sine', 2200, 0.3,  0.15, 0.3);
  }

  /* Roll Golden — fanfare courte */
  function golden() {
    init();
    const melody = [523, 659, 784, 1047];
    melody.forEach((f, i) => note('triangle', f, 0.18, i * 0.08, 0.7));
    note('sine', 1047, 0.4, melody.length * 0.08, 0.5);
  }

  /* Roll Rainbow — montée épique */
  function rainbow() {
    init();
    const freqs = [261, 329, 392, 523, 659, 784, 1047, 1319];
    freqs.forEach((f, i) => {
      note('sine',     f,      0.25, i * 0.06, 0.6);
      note('triangle', f * 2,  0.2,  i * 0.06, 0.3);
    });
    // Bruit blanc final
    noise(0.15, freqs.length * 0.06, 0.4);
  }

  /* Roll Monochrome — statique "TV noir et blanc" + accord grave dramatique, la plus rare des mutations */
  function monochrome() {
    init();
    noise(0.3, 0, 0.5);
    const freqs = [130, 196, 261, 392, 523, 659, 784, 1047, 1319, 1568];
    freqs.forEach((f, i) => {
      note('square', f,     0.22, i * 0.05, 0.45);
      note('sine',   f * 2, 0.18, i * 0.05, 0.25);
    });
    noise(0.2, freqs.length * 0.05, 0.5);
  }

  /* Achat potion / vente — "coin" */
  function coin() {
    init();
    note('sine', 987,  0.1,  0,    0.5);
    note('sine', 1318, 0.15, 0.06, 0.4);
  }

  /* Craft réussi */
  function craft() {
    init();
    note('square', 440, 0.05, 0,    0.4);
    note('square', 554, 0.05, 0.06, 0.4);
    note('square', 659, 0.05, 0.12, 0.4);
    note('sine',   880, 0.3,  0.18, 0.5);
  }

  /* Level up — jingle victorieux */
  function levelUp() {
    init();
    const seq = [523, 659, 784, 659, 784, 1047];
    seq.forEach((f, i) => note('triangle', f, 0.18, i * 0.1, 0.7));
  }

  /* Quête réclamée */
  function questClaim() {
    init();
    note('sine', 659,  0.1,  0,    0.6);
    note('sine', 784,  0.1,  0.08, 0.6);
    note('sine', 1047, 0.25, 0.16, 0.7);
  }

  /* Erreur (pas assez de pièces) */
  function error() {
    init();
    note('sawtooth', 220, 0.08, 0,    0.4);
    note('sawtooth', 180, 0.1,  0.06, 0.3);
  }

  /* Toggle auto-roll ON */
  function autoOn() {
    init();
    note('sine', 440, 0.1, 0,    0.4);
    note('sine', 660, 0.1, 0.08, 0.4);
  }

  /* Toggle auto-roll OFF */
  function autoOff() {
    init();
    note('sine', 660, 0.1, 0,    0.3);
    note('sine', 440, 0.1, 0.08, 0.3);
  }

  /* ════════════════════════════════════════════
     CONTRÔLES
  ════════════════════════════════════════════ */

  function toggle() {
    enabled = !enabled;
    return enabled;
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
  }

  function isEnabled() { return enabled; }

  return { roll, shiny, golden, rainbow, monochrome, coin, craft, levelUp, questClaim, error, autoOn, autoOff, toggle, setVolume, isEnabled };
})();
