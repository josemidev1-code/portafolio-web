/** Placas de bronce de Atenea, Hermes y Hefesto y estandartes carmesí de las salas. */
export function addMythology(THREE, scene, canvasTex, compact, M) {
  // En la Sala I el muro lo ocupa el relieve de Atenea (gods.js).
  const panels = [{ name: 'HERMES', caption: 'INGENIO · SALA II', z: -16.9, side: -1, icon: 'wings' },
    { name: 'HEFESTO', caption: 'CREACIÓN · SALA III', z: -28.9, side: -1, icon: 'hammer' }];
  function drawIcon(g, icon, x, y) {
    g.save(); g.translate(x, y); g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
    const stroke = () => { g.strokeStyle = 'rgba(20,12,6,.7)'; g.save(); g.translate(2, 3); g.stroke(); g.restore(); g.strokeStyle = '#e2c387'; g.stroke(); };
    if (icon === 'owl') {
      g.beginPath(); g.ellipse(0, 20, 76, 105, 0, 0, Math.PI * 2); stroke();
      [-1, 1].forEach(s => { g.beginPath(); g.arc(s * 37, -12, 33, 0, Math.PI * 2); stroke(); g.beginPath(); g.arc(s * 37, -12, 9, 0, Math.PI * 2); g.fillStyle = '#e2c387'; g.fill();
        g.beginPath(); g.moveTo(s * 70, -36); g.lineTo(s * 85, -85); g.lineTo(s * 20, -46); stroke(); });
      g.beginPath(); g.moveTo(-12, 13); g.lineTo(0, 39); g.lineTo(12, 13); stroke();
      for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-40, 55 + i * 19); g.lineTo(0, 75 + i * 16); g.lineTo(40, 55 + i * 19); stroke(); }
    } else if (icon === 'wings') {
      g.beginPath(); g.moveTo(0, -90); g.lineTo(0, 100); stroke();
      [-1, 1].forEach(s => {
        g.beginPath(); g.moveTo(0, -15); g.bezierCurveTo(s * 65, -70, s * 125, -80, s * 145, -115); g.bezierCurveTo(s * 140, -20, s * 70, 10, 0, 10); stroke();
        for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(s * (25 + i * 20), -18); g.lineTo(s * (60 + i * 18), -62 - i * 8); stroke(); }
        g.beginPath(); g.moveTo(0, 75); g.bezierCurveTo(s * 70, 45, s * 60, 20, 0, 0); stroke();
      });
    } else {
      g.rotate(-.35); g.beginPath(); g.rect(-23, -95, 118, 46); stroke(); g.beginPath(); g.rect(11, -46, 16, 155); stroke();
      g.rotate(.35); g.beginPath(); g.moveTo(-90, 95); g.lineTo(-67, 54); g.lineTo(-48, 74); g.lineTo(-23, 25); stroke();
    }
    g.restore();
  }
  const plaques = [];
  panels.forEach(p => {
    const texture = canvasTex(512, 768, (g, w, h) => {
      // Placa de bronce oscurecido con marco dorado y relieve en oro viejo.
      const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, '#3a2c20'); grd.addColorStop(.5, '#2a2019'); grd.addColorStop(1, '#3d2e22'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${Math.random() > .7 ? '90,130,110' : '0,0,0'},${Math.random() * .08})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
      g.strokeStyle = '#b98f55'; g.lineWidth = 3; g.strokeRect(24, 24, w - 48, h - 48); g.lineWidth = 1.5; g.strokeRect(36, 36, w - 72, h - 72);
      g.textAlign = 'center'; g.fillStyle = '#cfae76'; g.font = '500 22px "Cinzel", Georgia, serif'; g.fillText('Μ Ο Υ Σ Ε Ι Ο Ν', w / 2, 100);
      drawIcon(g, p.icon, w / 2, 330);
      g.font = '600 50px "Cinzel", Georgia, serif'; g.fillStyle = '#ead8b6'; g.fillText(p.name, w / 2, 598);
      g.font = '600 15px "Instrument Sans", sans-serif'; g.fillStyle = '#b89c70'; g.fillText(p.caption.split('').join(' '), w / 2, 642);
      g.font = 'italic 500 24px "Cormorant Garamond", Georgia, serif'; g.fillStyle = '#c9b48f'; g.fillText('Donde las ideas cobran forma', w / 2, 694);
    }, { text: true });
    const group = new THREE.Group(); group.position.set(p.side * 5.86, 3.45, p.z); group.rotation.y = p.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.24, .08), M.marble); frame.castShadow = frame.receiveShadow = true; group.add(frame);
    const backing = new THREE.Mesh(new THREE.BoxGeometry(2.05, 3.08, .06), M.bronze); backing.position.z = .05; group.add(backing);
    const image = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), new THREE.MeshStandardMaterial({ map: texture, roughness: .45, metalness: .55 })); image.position.z = .081; group.add(image);
    scene.add(group); plaques.push(group);
  });
  // Estandartes carmesí con greca dorada y corona de laurel.
  const bannerMap = canvasTex(256, 768, (g, w, h) => {
    g.fillStyle = '#5a1216'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 2) { g.fillStyle = x % 6 ? 'rgba(0,0,0,.05)' : 'rgba(255,190,140,.04)'; g.fillRect(x, 0, 1, h); }
    for (let y = 0; y < h; y += 3) { g.fillStyle = 'rgba(0,0,0,.035)'; g.fillRect(0, y, w, 1); }
    g.strokeStyle = '#c29a5c'; g.lineWidth = 3;
    const band = (y) => { for (let x = 22; x < w - 30; x += 26) { g.beginPath(); g.moveTo(x, y + 18); g.lineTo(x + 22, y + 18); g.lineTo(x + 22, y); g.lineTo(x + 6, y); g.lineTo(x + 6, y + 11); g.lineTo(x + 15, y + 11); g.stroke(); } };
    band(40); band(h - 120);
    g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = '#c9a466';
    for (let i = 0; i < 2; i++) for (let k = 0; k < 9; k++) { const a = Math.PI * (.62 + k * .095), s = i ? -1 : 1; g.save(); g.translate(w / 2 + s * Math.cos(a) * 70, 300 - Math.sin(a) * 70); g.rotate(s * (a + .4)); g.beginPath(); g.ellipse(0, 0, 6, 15, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
    g.beginPath(); g.arc(w / 2, 300, 22, 0, Math.PI * 2); g.lineWidth = 3; g.stroke();
    g.font = '600 26px "Cinzel", Georgia, serif'; g.textAlign = 'center'; g.fillText('ΜΟΥΣΕΙΟΝ', w / 2, 440);
  }, { text: true });
  const banners = [];
  const bannerMat = new THREE.MeshStandardMaterial({ map: bannerMap, roughness: .95, side: THREE.DoubleSide });
  // Detrás de cada dios cuelga un estandarte, como un telón.
  for (const [z, side] of [[-7.9, -1], [-19.9, -1], [-31.9, -1]]) {
    const geo = new THREE.PlaneGeometry(1.05, 3.25, 8, 20), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < -1.45) p.setY(i, y + Math.abs(p.getX(i)) * .38); p.setZ(i, Math.sin(p.getX(i) * 10) * .045); }
    geo.computeVertexNormals(); const banner = new THREE.Mesh(geo, bannerMat);
    banner.position.set(side * 5.6, 4.6, z); banner.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; banner.castShadow = !compact; banner.receiveShadow = true; scene.add(banner); banners.push({ banner, original: new Float32Array(p.array), phase: z + side });
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.25, 12), M.gilt); rod.rotation.x = Math.PI / 2; rod.position.set(side * 5.6, 6.23, z); scene.add(rod);
  }
  return {
    update(t, reduce) {
      if (!reduce) banners.forEach(({ banner, original, phase }) => { const p = banner.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const y = original[i * 3 + 1], influence = (1.625 - y) / 3.25; p.setZ(i, original[i * 3 + 2] + Math.sin(t * 1.1 + y * 2 + phase) * .025 * influence); } p.needsUpdate = true; });
    }
  };
}
