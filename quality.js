/** Calidad gráfica según el equipo: detecta la tarjeta gráfica al cargar, elige un nivel
 *  y lo rebaja sola si los fotogramas por segundo no llegan. El visitante también puede fijarlo. */
export const LEVELS = ['baja', 'media', 'alta'];

// Qué activa cada nivel. Todo se puede cambiar en caliente salvo la geometría «compacta».
export const PRESETS = {
  alta:  { pixelCap: 1.75, scale: 1,  post: true,  ao: 6, blur: true,  samples: 2, sunMap: 2048, heroShadow: true,  extraLights: true,  shadowEvery: 1, dust: true },
  media: { pixelCap: 1.25, scale: 1,  post: true,  ao: 4, blur: false, samples: 0, sunMap: 1024, heroShadow: false, extraLights: true,  shadowEvery: 1, dust: true },
  baja:  { pixelCap: 1,    scale: .85, post: false, ao: 0, blur: false, samples: 0, sunMap: 1024, heroShadow: false, extraLights: false, shadowEvery: 6, dust: false }
};

const KEY = 'museo-calidad', AUTO_KEY = 'museo-calidad-auto';
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento: solo dura la visita */ } }
};

/** Lee el nombre de la gráfica con un contexto WebGL de prueba que se libera enseguida. */
function gpuName() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return name;
  } catch { return ''; }
}

/** Primera estimación a partir de la gráfica, los núcleos y la memoria del equipo. */
export function detectLevel({ mobile }) {
  const gpu = gpuName(), g = gpu.toLowerCase();
  const cores = navigator.hardwareConcurrency || 4, memory = navigator.deviceMemory || 8;
  let level = 'media';
  if (/swiftshader|llvmpipe|softpipe|basic render|software/.test(g)) level = 'baja';
  // Gráficas integradas de Intel anteriores a Iris Xe: las de la mayoría de aulas y portátiles básicos.
  else if (/intel/.test(g) && !/iris|arc/.test(g)) level = 'baja';
  else if (/mali-[2-4]|mali-t|adreno.*\b[2-5]\d\d\b|powervr|videocore/.test(g)) level = 'baja';
  else if (/nvidia|geforce|quadro|rtx|radeon (rx|pro)|\brx \d|apple m\d|apple gpu/.test(g) && !mobile) level = 'alta';
  if (cores <= 2 || memory <= 2) level = 'baja';
  else if ((cores <= 4 || memory <= 4) && level === 'alta') level = 'media';
  if (mobile && level === 'alta') level = 'media';
  return { level, gpu };
}

const lower = (a, b) => LEVELS[Math.min(LEVELS.indexOf(a), LEVELS.indexOf(b))];

/** Nivel con el que arranca la visita: la elección del visitante, o la detección corregida
 *  por lo que se midió en visitas anteriores. */
export function initialQuality({ mobile }) {
  const choice = store.get(KEY);
  const detected = detectLevel({ mobile });
  const measured = store.get(AUTO_KEY);
  const auto = LEVELS.includes(measured) ? lower(detected.level, measured) : detected.level;
  const manual = LEVELS.includes(choice) ? choice : null;
  return { mode: manual ? 'manual' : 'auto', level: manual || auto, detected: detected.level, gpu: detected.gpu };
}

/** Vigila el rendimiento real: si durante unos segundos no se alcanzan ~30 fps,
 *  baja un nivel (y después la resolución) y lo recuerda para la próxima visita. */
export function createGovernor({ getLevel, setLevel, setScale, isAuto, isBusy }) {
  let frames = 0, since = 0, waitUntil = 0, scale = 1, armed = false;
  return {
    start(now) { armed = true; since = now; frames = 0; waitUntil = now + 1500; },
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
      if (i > 0) { setLevel(LEVELS[i - 1]); store.set(AUTO_KEY, LEVELS[i - 1]); }
      else if (scale > .6) { scale = Math.max(.6, scale - .15); setScale(scale); }
      else armed = false;
      waitUntil = now + 2000;
    }
  };
}

export function saveChoice(mode) { if (mode === 'auto') { try { localStorage.removeItem(KEY); localStorage.removeItem(AUTO_KEY); } catch { /* */ } } else store.set(KEY, mode); }
