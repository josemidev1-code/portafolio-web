(function(){
  const form = document.getElementById('contact-form');
  const btn = document.getElementById('cf-btn');
  const status = document.getElementById('cf-status');
  if (!form || !btn || !status) return;

  const rules = [
    ['cf-nombre','err-nombre', v => v.trim().length >= 2, 'Dime tu nombre (mín. 2 letras).'],
    ['cf-email','err-email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Ese email no parece válido.'],
    ['cf-mensaje','err-mensaje', v => v.trim().length >= 20, 'Cuéntame un poco más (mín. 20 caracteres).']
  ];

  function validate(){
    let ok = true;
    rules.forEach(([id, errId, test, msg]) => {
      const el = document.getElementById(id);
      const error = document.getElementById(errId);
      const valid = test(el.value);
      el.setAttribute('aria-invalid', String(!valid));
      error.classList.toggle('hidden', valid);
      error.textContent = valid ? '' : msg;
      if (!valid) ok = false;
    });
    return ok;
  }

  rules.forEach(([id]) => document.getElementById(id).addEventListener('blur', validate));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.elements.botcheck && form.elements.botcheck.value) return;
    if (!validate()) {
      status.textContent = 'Revisa los campos marcados.';
      status.className = 'text-sm text-center text-red-400';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Enviando…';
    status.textContent = '';

    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'No se pudo enviar');
      status.textContent = '✔ Mensaje enviado correctamente. Te responderé lo antes posible.';
      status.className = 'text-sm text-center text-emerald-400';
      form.reset();
    } catch (error) {
      status.textContent = '✖ No se ha podido enviar. Puedes escribirme directamente al correo indicado en la web.';
      status.className = 'text-sm text-center text-red-400';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviar solicitud';
    }
  });
})();

// --- 1. ROI Chart.js Initialization & Logic ---

        let roiChartInstance = null;



        function initROIChart() {

            const ctx = document.getElementById('roiChart').getContext('2d');

            roiChartInstance = new Chart(ctx, {

                type: 'bar',

                data: {

                    labels: ['Año 1', 'Año 2', 'Año 3'],

                    datasets: [

                        {

                            label: 'Sin Automatización (Pérdida Acumulada €)',

                            data: [52000, 104000, 156000],

                            backgroundColor: 'rgba(248, 113, 113, 0.7)',

                            borderColor: 'rgba(248, 113, 113, 1)',

                            borderWidth: 1,

                            borderRadius: 6

                        },

                        {

                            label: 'Con Automatización (Capital Conservado €)',

                            data: [46800, 93600, 140400],

                            backgroundColor: 'rgba(34, 211, 238, 0.7)',

                            borderColor: 'rgba(34, 211, 238, 1)',

                            borderWidth: 1,

                            borderRadius: 6

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            display: false

                        },

                        tooltip: {

                            callbacks: {

                                label: function(context) {

                                    let label = context.dataset.label || '';

                                    if (label) {

                                        label += ': ';

                                    }

                                    if (context.parsed.y !== null) {

                                        label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(context.parsed.y);

                                    }

                                    return label;

                                }

                            }

                        }

                    },

                    scales: {

                        x: {

                            ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } },

                            grid: { color: 'rgba(255, 255, 255, 0.05)' }

                        },

                        y: {

                            ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } },

                            grid: { color: 'rgba(255, 255, 255, 0.05)' }

                        }

                    }

                }

            });

        }



        function updateROICalculator() {

            const employees = parseInt(document.getElementById('input-employees').value);

            const hours = parseInt(document.getElementById('input-hours').value);

            const rate = parseInt(document.getElementById('input-rate').value);
            const automation = parseInt(document.getElementById('input-automation').value) / 100;



            document.getElementById('val-employees').innerText = employees;

            document.getElementById('val-hours').innerText = hours + ' h';

            document.getElementById('val-rate').innerText = rate + ' €';
            document.getElementById('val-automation').innerText = Math.round(automation * 100) + '%';



            // Annual loss = employees * hours * rate * 52 weeks

            const annualLoss = employees * hours * rate * 52;

            const formattedLoss = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(annualLoss);



            document.getElementById('annual-loss-display').innerText = formattedLoss;



            if (roiChartInstance) {

                const year1Loss = annualLoss;

                const year2Loss = annualLoss * 2;

                const year3Loss = annualLoss * 3;



                const year1Saved = annualLoss * automation;

                const year2Saved = year2Loss * automation;

                const year3Saved = year3Loss * automation;



                roiChartInstance.data.datasets[0].data = [year1Loss, year2Loss, year3Loss];

                roiChartInstance.data.datasets[1].data = [year1Saved, year2Saved, year3Saved];

                roiChartInstance.update();

            }

        }



        // --- 2. Bento Grid Interactive Tab ---

        function switchBentoTab(tab) {

            const btnGym = document.getElementById('btn-tab-gym');

            const btnCode = document.getElementById('btn-tab-code');

            const content = document.getElementById('bento-tab-content');



            if (tab === 'gym') {

                btnGym.className = "px-3 py-1.5 rounded-lg text-xs font-mono bg-accent-cyan text-surface-dark font-bold";

                btnCode.className = "px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-slate-400 hover:text-white";

                content.innerText = '"Constancia diaria sin excusas. Aceptación del dolor muscular como métrica de progreso real."';

            } else {

                btnCode.className = "px-3 py-1.5 rounded-lg text-xs font-mono bg-accent-cyan text-surface-dark font-bold";

                btnGym.className = "px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-slate-400 hover:text-white";

                content.innerText = '"Refactorización continua. Búsqueda de bugs hasta garantizar un sistema inmune a errores de produccion."';

            }

        }



        // --- 3. Workflow Simulation Logic ---

        function runWorkflowSimulation() {

            const inputVal = document.getElementById('sim-input-text').value;

            const btn = document.getElementById('btn-run-sim');

            const logBox = document.getElementById('sim-log-output');

            if (btn.disabled) return;
            for (let paso = 1; paso <= 5; paso++) {
                document.getElementById(`step-${paso}`).className = 'p-4 rounded-2xl bg-surface-dark border border-white/10 text-center transition-all';
                const estado = document.getElementById(`step-${paso}-status`);
                estado.textContent = 'En espera';
                estado.className = 'mt-2 text-[10px] font-mono text-slate-500';
            }



            btn.disabled = true;

            btn.innerText = "⏳ Ejecutando...";

            logBox.innerHTML = `<div>[${new Date().toLocaleTimeString()}] INICIANDO FLUJO DE AGENTE AGÉNTICO n8n...</div>`;



            // Helper function to activate steps

            const activateStep = (stepNum, textStatus, colorClass) => {

                const el = document.getElementById(`step-${stepNum}`);

                const statusEl = document.getElementById(`step-${stepNum}-status`);

                el.className = `p-4 rounded-2xl bg-surface-dark border ${colorClass} text-center transition-all scale-105 shadow-lg`;

                statusEl.innerText = textStatus;

                statusEl.className = `mt-2 text-[10px] font-mono font-bold ${colorClass.replace('border-', 'text-')}`;

            };



            // Step 1: Webhook

            setTimeout(() => {

                activateStep(1, '✓ Webhook POST 200', 'border-accent-cyan');

                const entrada = document.createElement('div');
                entrada.className = 'text-accent-cyan';
                entrada.textContent = `> [Paso 1] Payload recibido correctamente: "${inputVal.substring(0, 35)}..."`;
                logBox.append(entrada);

            }, 400);



            // Step 2: Python Script

            setTimeout(() => {

                activateStep(2, '✓ Python OK', 'border-emerald-400');

                logBox.innerHTML += `<div class="text-emerald-400">&gt; [Paso 2] Script Python ejecutado. Texto sanitizado, caracteres extraños removidos.</div>`;

            }, 900);



            // Step 3: LLM AI Agent

            setTimeout(() => {

                activateStep(3, '✓ Clasificado IA', 'border-purple-400');

                logBox.innerHTML += `<div class="text-purple-400">&gt; [Paso 3] Inferencia LLM finalizada. Categoría: "Automatización de Procesos Empresariales". Urgencia: ALTA.</div>`;

            }, 1500);



            // Step 4: Smart Router

            setTimeout(() => {

                activateStep(4, '✓ Prioridad Alta', 'border-sky-400');

                logBox.innerHTML += `<div class="text-sky-400">&gt; [Paso 4] Enrutador inteligente activado -&gt; Ruta de Respuesta Inmediata B2B.</div>`;

            }, 2000);



            // Step 5: Multi-Channel Action

            setTimeout(() => {

                activateStep(5, '✓ Alerta Enviada', 'border-emerald-400');

                logBox.innerHTML += `<div class="text-emerald-400 font-bold">&gt; [Paso 5] Notificación enviada a Telegram (+34 621 030 510) y correo jmenterprice73@gmail.com en 2.3s.</div>`;

                btn.disabled = false;

                btn.innerText = "▶ Ejecutar Flujo de IA";

            }, 2600);

        }



        // --- 4. Tech Stack Filtering ---

        function filterTechStack(category, activeBtn) {

            const cards = document.querySelectorAll('.tech-card');

            const btns = document.querySelectorAll('.tech-filter-btn');



            btns.forEach(btn => {

                btn.className = "tech-filter-btn px-4 py-2 rounded-xl text-xs font-mono bg-white/5 text-slate-300 hover:text-white border border-white/10";

            });

            if (activeBtn) activeBtn.className = "tech-filter-btn px-4 py-2 rounded-xl text-xs font-mono bg-accent-cyan text-surface-dark font-bold";



            cards.forEach(card => {

                if (category === 'all' || card.dataset.category === category) {

                    card.style.display = 'block';

                } else {

                    card.style.display = 'none';

                }

            });

        }



        function cmdRepos() {
            return `
                <div class="space-y-2">
                    <div class="text-accent-cyan font-bold">GitHub // josemidev1-code</div>
                    <div><a class="underline hover:text-white" href="https://github.com/josemidev1-code" target="_blank" rel="noopener noreferrer">Abrir perfil ↗</a></div>
                    <div><a class="underline hover:text-white" href="https://github.com/josemidev1-code/portafolio-web" target="_blank" rel="noopener noreferrer">Código del portfolio ↗</a></div>
                    <div><a class="underline hover:text-white" href="https://josemidev1-code.github.io/JOSEMI-OS/" target="_blank" rel="noopener noreferrer">Abrir JOSEMI-OS ↗</a></div>
                </div>`;
        }

        // --- 5. Terminal CLI Handler ---

        function handleCliInput(e) {

            if (e.key === 'Enter') {

                const inputEl = document.getElementById('cli-input');

                const cmd = inputEl.value.trim().toLowerCase();

                const outputEl = document.getElementById('cli-output');



                if (cmd === '') return;



                let response = '';



                switch(cmd) {

                    case 'gh':
                        response = cmdRepos();
                        break;

                    case 'help':

                        response = `

                            <div class="text-accent-cyan font-bold">Comandos disponibles:</div>

                            <div>- <span class="text-white">quiensoy</span>: Resumen sobre José Miguel</div>

                            <div>- <span class="text-white">skills</span>: Resumen de habilidades técnicas</div>

                            <div>- <span class="text-white">contacto</span>: Muestra teléfonos y e-mail directos</div>

                            <div>- <span class="text-white">estudios</span>: Información sobre grado DAM</div>

                            <div>- <span class="text-white">gh</span>: Abre mis enlaces de GitHub</div>
                           <div>- <span class="text-white">clear</span>: Limpia la terminal</div>

                        `;

                        break;

                    case 'quiensoy':

                        response = `<div class="text-slate-200">José Miguel (20 años). Programador full-stack y especialista en IA. Disciplinado (5 días/semana gimnasio), resiliente y enfocado en solucionar problemas de empresa.</div>`;

                        break;

                    case 'skills':

                        response = `<div class="text-slate-200">n8n, Python, Java, React, Next.js, SQL, Tailwind, Linux, Prompt Engineering, Agentes IA autónomos.</div>`;

                        break;

                    case 'contacto':

                        response = `<div class="text-accent-cyan">E-mail: jmenterprice73@gmail.com | Tel: +34 621 030 510 | GitHub: josemidev1-code</div>`;

                        break;

                    case 'estudios':

                        response = `<div class="text-slate-200">Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM) - IES Dr. Lluís Simarro.</div>`;

                        break;

                    case 'clear':

                        outputEl.innerHTML = '';

                        inputEl.value = '';

                        return;

                    default:

                        response = '<div class="text-rose-400">Comando no reconocido. Escriba "help" para ver opciones.</div>';

                }



                const linea = document.createElement('div');
                linea.className = 'mt-2';
                const comando = document.createElement('span');
                comando.className = 'text-accent-cyan font-bold';
                comando.textContent = `> ${cmd}`;
                const respuesta = document.createElement('div');
                respuesta.className = 'mt-1';
                // Solo las respuestas constantes del programa contienen HTML.
                respuesta.innerHTML = response;
                linea.append(comando, respuesta);
                outputEl.append(linea);



                inputEl.value = '';

                outputEl.scrollTop = outputEl.scrollHeight;

            }

        }

        function filterCases(category, activeBtn) {
            document.querySelectorAll('.case-card').forEach(card => {
                card.style.display = category === 'all' || card.dataset.category === category ? 'block' : 'none';
            });
            document.querySelectorAll('.case-filter-btn').forEach(btn => {
                btn.className = 'case-filter-btn px-4 py-2 rounded-xl text-xs font-mono bg-white/5 text-slate-300 border border-white/10';
            });
            if (activeBtn) activeBtn.className = 'case-filter-btn px-4 py-2 rounded-xl text-xs font-mono bg-accent-cyan text-surface-dark font-bold';
        }

        // --- 7. Mobile Menu Toggle ---

        document.getElementById('mobile-menu-btn').addEventListener('click', () => {

            const menu = document.getElementById('mobile-menu');

            menu.classList.toggle('hidden');

        });



        // Initialize chart on load

        window.addEventListener('DOMContentLoaded', () => {

            initROIChart();
            updateROICalculator();

        });
