/** Calidad gráfica según el equipo: detecta la tarjeta gráfica al cargar, elige un nivel
 *  y lo rebaja sola si los fotogramas por segundo no llegan. El visitante también puede fijarlo. */
export const LEVELS = ['baja', 'media', 'alta'];

// Qué activa cada nivel. Todo se puede cambiar en caliente salvo la geometría «compacta».
export const PRESETS = {
  alta:  { pixelCap: 1.75, scale: 1,  post: true,  ao: 6, blur: true,  samples: 2, sunMap: 2048, heroShadow: true,  extraLights: true,  shadowEvery: 1, dust: true, reflect: true },
  media: { pixelCap: 1.25, scale: 1,  post: true,  ao: 4, blur: false, samples: 0, sunMap: 1024, heroShadow: false, extraLights: true,  shadowEvery: 1, dust: true, reflect: false },
  baja:  { pixelCap: 1,    scale: .80, post: false, ao: 0, blur: false, samples: 0, sunMap: 512, heroShadow: false, extraLights: false, shadowEvery: 6, dust: false, reflect: false }
};

const KEY = 'museo-calidad';
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento: solo dura la visita */ } }
};

// La primera compilación usa el perfil ligero incluso si el navegador anuncia una GPU rápida.
export function initialQuality() {
  const choice = store.get(KEY);
  return LEVELS.includes(choice)
    ? { mode: 'manual', level: choice }
    : { mode: 'auto', level: 'baja' };
}

/** Vigila el rendimiento real: si durante unos segundos no se alcanzan ~30 fps,
 *  baja un nivel (y después la resolución) y lo recuerda para la próxima visita. */
export function createGovernor({ getLevel, setLevel, setScale, isAuto, isBusy, onStall }) {
  let frames = 0, since = 0, waitUntil = 0, scale = 1, armed = false;
  return {
    start(now) { armed = true; scale = 1; since = now; frames = 0; waitUntil = now + 1500; },
    reset(now) { since = now; frames = 0; waitUntil = now + 1000; },
    tick(now) {
      if (!armed || !isAuto()) return;
      if (now < waitUntil || isBusy()) { since = now; frames = 0; return; }
      frames++;
      const elapsed = now - since;
      if (elapsed < 2500) return;
      const fps = frames * 1000 / elapsed;
      since = now; frames = 0;
      if (fps >= 28) return;
      const level = getLevel(), i = LEVELS.indexOf(level);
      if (i > 0) { setLevel(LEVELS[i - 1]); }
      else if (scale > .6) { scale = Math.max(.6, scale - .15); setScale(scale); }
      else if (fps < 8) {
        armed = false;
        onStall();
      }
      waitUntil = now + 2000;
    }
  };
}

export function saveChoice(mode) { if (mode === 'auto') { try { localStorage.removeItem(KEY); } catch { /* */ } } else store.set(KEY, mode); }
