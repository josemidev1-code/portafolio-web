'use strict';

// Inicializaciones independientes: las demos no dependen de servicios externos.
(() => {
  const menu = document.getElementById('mobile-menu');
  const button = document.getElementById('mobile-menu-btn');
  const close = () => { menu.classList.remove('open'); button.setAttribute('aria-expanded', 'false'); };
  button.addEventListener('click', () => { const open = menu.classList.toggle('open'); button.setAttribute('aria-expanded', String(open)); });
  menu.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.classList.contains('open')) { close(); button.focus(); } });
  window.matchMedia('(min-width:701px)').addEventListener('change', close);
  function openAnchor() { const target = document.getElementById(location.hash.slice(1)); if (target?.tagName === 'DETAILS') target.open = true; }
  window.addEventListener('hashchange', openAnchor);
  openAnchor();
})();

function installFilters(attribute, cardSelector, emptyId) {
  const buttons = [...document.querySelectorAll(`[${attribute}]`)];
  const cards = [...document.querySelectorAll(cardSelector)];
  buttons.forEach(button => button.addEventListener('click', () => {
    const category = button.getAttribute(attribute);
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    cards.forEach(card => { card.hidden = category !== 'all' && card.dataset.category !== category; });
    const empty = emptyId ? document.getElementById(emptyId) : null;
    if (empty) empty.hidden = cards.some(card => !card.hidden);
  }));
}
installFilters('data-case', '.project-card', 'case-empty');
installFilters('data-tech', '.tech-card');

(() => {
  const money = value => new Intl.NumberFormat('es-ES', {style:'currency', currency:'EUR', maximumFractionDigits:0}).format(value);
  const svg = document.getElementById('roiChart');
  const body = document.getElementById('roi-table-body');
  const ns = 'http://www.w3.org/2000/svg';
  const group = document.createElementNS(ns, 'g');
  group.setAttribute('aria-hidden', 'true'); svg.append(group);
  function shape(tag, attrs, text) {
    const element = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text) element.textContent = text;
    group.append(element);
  }
  function update() {
    const people = Number(document.getElementById('input-employees').value);
    const hours = Number(document.getElementById('input-hours').value);
    const rate = Number(document.getElementById('input-rate').value);
    const fraction = Number(document.getElementById('input-automation').value) / 100;
    document.getElementById('val-employees').textContent = people;
    document.getElementById('val-hours').textContent = `${hours} h`;
    document.getElementById('val-rate').textContent = money(rate);
    document.getElementById('val-automation').textContent = `${Math.round(fraction * 100)} %`;
    const annual = people * hours * rate * 52;
    document.getElementById('annual-loss-display').textContent = money(annual);
    group.replaceChildren(); body.replaceChildren();
    shape('line', {x1:20,y1:205,x2:410,y2:205,stroke:'#526055'});
    for (let year = 1; year <= 3; year++) {
      const cost = annual * year, saved = cost * fraction, x = 40 + (year - 1) * 130, height = year / 3 * 170;
      shape('rect', {x,y:205-height,width:38,height,rx:3,fill:'#a8c8fb'});
      shape('rect', {x:x+44,y:205-height*fraction,width:38,height:height*fraction,rx:3,fill:'#d5f478'});
      shape('text', {x:x+40,y:229,'text-anchor':'middle',fill:'#aab5ad','font-size':12}, `Año ${year}`);
      const tr = document.createElement('tr');
      [year, money(cost), money(saved)].forEach(value => {const td=document.createElement('td');td.textContent=value;tr.append(td);});
      body.append(tr);
    }
  }
  document.querySelectorAll('.range-controls input').forEach(input => input.addEventListener('input', update));
  update();
})();

(() => {
  const button = document.getElementById('btn-run-sim'), output = document.getElementById('sim-log-output');
  button.addEventListener('click', async () => {
    if (button.disabled) return;
    const input = document.getElementById('sim-input-text').value.trim();
    if (!input) { output.textContent = 'Escribe una solicitud para simular el flujo.'; return; }
    button.disabled = true; button.textContent = 'Simulando…'; output.replaceChildren();
    for (let step = 1; step <= 5; step++) {
      document.getElementById(`step-${step}`).classList.remove('complete');
      document.getElementById(`step-${step}-status`).textContent = 'En espera';
    }
    const messages = [`Entrada de ejemplo: «${input.slice(0, 120)}».`, 'Preparación simulada: el texto se muestra de forma segura.', 'Clasificación de ejemplo: consulta sobre automatización. No se ha consultado una IA.', 'Enrutado simulado: revisión del proyecto.', 'Simulación completada. No se ha enviado ningún mensaje real.'];
    try {
      for (let step=1; step<=5; step++) {
        await new Promise(resolve => setTimeout(resolve, 450));
        document.getElementById(`step-${step}`).classList.add('complete');
        document.getElementById(`step-${step}-status`).textContent = '✓ Simulado';
        const line = document.createElement('p'); line.textContent = `${step}. ${messages[step-1]}`; output.append(line);
        output.scrollTop = output.scrollHeight;
      }
    } finally { button.disabled = false; button.textContent = 'Ejecutar simulación'; }
  });
})();

(() => {
  const input = document.getElementById('cli-input'), output = document.getElementById('cli-output');
  const answers = {
    help:'Comandos: help, quiensoy, skills, estudios, contacto, gh, clear.',
    quiensoy:'Soy José Miguel Miralles Gandia, estudiante de DAM. Aprendo creando proyectos web y explorando la IA y la automatización.',
    skills:'HTML, CSS y JavaScript en uso; Git y GitHub; IA aplicada. Estoy aprendiendo Java y practicando con Linux y n8n.',
    estudios:'Desarrollo de Aplicaciones Multiplataforma en el IES Dr. Lluís Simarro.',
    contacto:'Puedes escribirme a jmenterprice73@gmail.com o usar el formulario de contacto.'
  };
  document.getElementById('cli-form').addEventListener('submit', event => {
    event.preventDefault(); const raw = input.value.trim(), command = raw.toLowerCase(); if (!command) return;
    input.value = ''; if (command === 'clear') { output.replaceChildren(); return; }
    const block = document.createElement('div'), prompt = document.createElement('p');
    prompt.className='accent'; prompt.textContent=`> ${raw}`; block.append(prompt);
    if (command === 'gh') {
      [['Mi perfil de GitHub','https://github.com/josemidev1-code'],['Código del portfolio','https://github.com/josemidev1-code/portafolio-web'],['Abrir JOSEMI-OS','https://josemidev1-code.github.io/JOSEMI-OS/']].forEach(([label,url])=>{
        const line=document.createElement('p'),link=document.createElement('a'); link.href=url;link.textContent=label;link.target='_blank';link.rel='noopener noreferrer';line.append(link);block.append(line);
      });
    } else { const reply=document.createElement('p');reply.textContent=answers[command]||'No reconozco ese comando. Escribe help para ver las opciones.';block.append(reply); }
    output.append(block); while(output.children.length>40) output.firstElementChild.remove(); output.scrollTop=output.scrollHeight;
  });
})();

(() => {
  const gym=document.getElementById('btn-tab-gym'),code=document.getElementById('btn-tab-code');
  [gym,code].forEach(button=>button.addEventListener('click',()=>{
    [gym,code].forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    document.getElementById('bento-tab-content').textContent=button===gym?'La constancia importa más que un día perfecto.':'Pruebo, reviso los errores y vuelvo a intentarlo.';
  }));
})();

// Contacto: la respuesta de Web3Forms determina el resultado mostrado.
(() => {
  const form=document.getElementById('contact-form'),button=document.getElementById('cf-btn'),status=document.getElementById('cf-status');
  const rules=[['cf-nombre','err-nombre',value=>value.trim().length>=2,'Escribe al menos dos caracteres.'],['cf-email','err-email',value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),'Revisa el formato del correo.'],['cf-mensaje','err-mensaje',value=>value.trim().length>=20,'Cuéntame algo más: al menos 20 caracteres.']];
  function validate(){let valid=true;for(const[id,errorId,test,message]of rules){const field=document.getElementById(id),error=document.getElementById(errorId),ok=test(field.value);field.setAttribute('aria-invalid',String(!ok));error.hidden=ok;error.textContent=ok?'':message;if(!ok)valid=false;}return valid;}
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(button.disabled||form.elements.botcheck.checked)return;
    if(!validate()){status.textContent='Revisa los campos marcados.';status.className='error';form.querySelector('[aria-invalid="true"]').focus();return;}
    button.disabled=true;button.textContent='Enviando…';status.textContent='';
    try{const response=await fetch(form.action,{method:'POST',body:new FormData(form)});const data=await response.json();if(!response.ok||data.success!==true)throw new Error('Envío rechazado');status.textContent='Mensaje aceptado por el servicio de envío. Gracias por escribirme.';status.className='success';form.reset();}
    catch{status.textContent='No se ha podido confirmar el envío. Puedes escribirme a jmenterprice73@gmail.com.';status.className='error';}
    finally{button.disabled=false;button.textContent='Enviar mensaje ↗';}
  });
})();
