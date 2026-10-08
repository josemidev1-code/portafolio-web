# Portafolio de José Miguel Miralles Gandia

Un museo digital de inspiración griega, ambientado en la saga griega de God of War, para explorar proyectos web y aplicaciones. El recorrido empieza en el ágora de Atenas, ante un muro con mi presentación grabada en piedra. Después cruza la estoa de columnas rojas y entra en una galería horizontal de cuatro salas en fila, como las del Prado, que se recorre de izquierda a derecha: en cada sala se para ante su dios y ante el proyecto colgado como un cuadro. Se avanza con la rueda del ratón o deslizando hacia arriba en el móvil.

## Qué hace cada tecnología

- **HTML** (`index.html`): contenido, navegación, fichas de proyectos y contacto.
- **CSS** (`museum.css`): tipografía (Cinzel para los títulos, Cormorant Garamond para los acentos e Instrument Sans para el texto), composición, paneles, transiciones y adaptación a móvil.
- **JavaScript y Three.js** (`museum.js`): escena 3D, cámara, recorrido e interacción. Three.js dibuja la escena utilizando WebGL.
- **Planta** (`layout.js`): cuatro salas en fila, vanos entre ellas y la altura y profundidad desde la que se mira cada sala.
- **Arquitectura** (`greek-temple.js`): estoa de columnas de mármol rojo con basas y capiteles de oro a lo largo de toda la fachada, frontón con medallón y omega sobre la puerta, entablamento con triglifos y mútulos, puertas de bronce. Dentro, sin columnas: muros de estuco lila con zócalo de mármol oscuro, friso de greca, techo de casetones con estrellas doradas y un lucernario por sala por el que entra el sol.
- **Texturas fotografiadas** (`textures.js`, `assets/texturas/`): suelo de mármol, estuco, sillares, losas, acantilado, tierra y cielo de atardecer de Poly Haven (CC0), a 1k o 2k según la calidad gráfica.
- **Materiales** (`materials.js`): mármol veteado, mármol rojo, bronce con pátina y oro de las molduras, generados en canvas con ruido periódico y proyectados en metros reales.
- **Dioses y colección** (`gods.js`): un dios por sala, con pedestal, inscripción griega, foco propio, parada en el recorrido y ficha interactiva; y una colección de esculturas y relieves griegos reales.
  - Sala I: estatua de Atenea de cuerpo entero, generada en 3D con Hunyuan3D a partir de las vistas frontal, de perfil y trasera de la hoja de referencia, con el rostro en alta resolución (`assets/atenea/`).
  - Sala II: Hermes, escaneado (`assets/hermes/`).
  - Sala III: Hefesto, modelado (`assets/hefesto/`).
  - Colección (`assets/piezas/`): Atenea del frontón de Egina, Atenea del Altar de Pérgamo, Discóbolo, metopas del Partenón, guerreros y arquero de Egina, Gladiador Borghese, Escudo Strangford, Poseidón del cabo Artemisio, Laocoonte, Ares Ludovisi y las cariátides del Erecteion en la puerta. Son escaneos 3D de vaciados de la Colección Real de Vaciados del SMK (Copenhague), de dominio público, reducidos y con la oclusión ambiental horneada.
- **Ágora y Atenas** (`athens.js`): plaza de losas con mosaico, cipreses, propileo y el muro grabado con mi presentación (interactivo). Alrededor, la Acrópolis con acantilado de roca y Atenas sobre colinas con casas, templos menores, cipreses y luces de ventanas al anochecer.
- **Fuego** (`fire.js`): braseros trípode de bronce, llamas con ruido animado en el sombreador (cinco capas con ritmos propios), brasas, humo y luz que titila de forma irregular.
- **Cámara libre en PC** (`free-camera.js`, `navigation.js`): WASD, mirada al arrastrar el ratón, Q/E para altura, Mayús para correr y Esc para regresar al recorrido. Incluye límites de muros, vanos entre salas y peanas.
- **Renderizado** (`cinematic.js`): oclusión ambiental en pantalla y desenfoque de cámara calculados con la profundidad. Los textos y botones permanecen nítidos.
- **Calidad gráfica** (`quality.js`): al cargar se lee la tarjeta gráfica, los núcleos y la memoria del equipo y se elige calidad alta, media o baja. Si después no se alcanzan unos 30 fps, baja un nivel (y luego la resolución) y lo recuerda para la próxima visita. El botón «Gráficos» permite fijarla a mano. La calidad baja pinta la escena sin posproceso, a menor resolución, con menos luces de relleno y con sombras que se recalculan cada pocos fotogramas, y carga la geometría y las esculturas ligeras.
- **Movimiento** (`motion.js`): amortiguación del avance y curvas de aceleración, independientes de la tasa de fotogramas.

Three.js 0.169.0 se carga desde jsDelivr y las tipografías desde Google Fonts. Se necesita conexión a Internet para estas dependencias. Las geometrías se generan en la página; se descargan las esculturas (comprimidas con Draco, en versión ligera para móvil) y las texturas fotografiadas.

## Ejecutar en local

Desde la carpeta del repositorio:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`. Usa un servidor HTTP para cargar los módulos de JavaScript.

## Recorrido

- Ágora con el muro grabado: nombre, estudios (1.º de DAM en el IES Dr. Lluís Simarro) y lo que busco. Se puede abrir como ficha con «Sobre mí».
- Estoa de columnas rojas con ΠΑΡΘΕΝΩΝ grabado en el arquitrabe, medallón con una omega dorada en el frontón, cariátides junto a la puerta y braseros encendidos.
- Galería horizontal: Atenea y JOSEMI-OS, Hermes y el asistente de gimnasio, Hefesto y el lienzo reservado, y la sala de salida con Poseidón. Fuego cálido bajo los relieves y luz fría de los lucernarios, con el God of War griego como referencia.
- Rótulos de sala legibles que permanecen durante la llegada y el comienzo de cada sala.
- La puerta del templo se abre al acercarse y se cierra al retroceder.
- Proyectos colgados como cuadros, con marco dorado, lámpara de cuadro, cartela y ficha ampliada.
- Recorrido continuo sin pausas rígidas entre salas, amortiguación conectada al bucle de cámara y curvas monótonas que conservan la velocidad.
- Desenfoque limitado a diez píxeles durante el movimiento, desactivado al solicitar movimiento reducido.
- Sol que entra por los lucernarios, focos sobre cuadros y esculturas, sombras PCF suaves, sombras de contacto, oclusión ambiental y reflejos de entorno moderados.
- En ordenador se puede alternar entre recorrido guiado y cámara libre. En móvil se mantiene el recorrido por deslizamiento.
- Navegación por rueda, deslizamiento nativo, botones del plano y teclado.
- Encuadre vertical específico y menor resolución gráfica en móvil. El efecto utiliza tres muestras en móvil y cinco en ordenador.
- Arquitectura estática agrupada por material y una luz principal con sombras.
- Botón para activar las animaciones aunque el sistema solicite movimiento reducido; la elección se recuerda en este navegador.
- Respeto inicial de la preferencia de movimiento reducido, pausa al ocultar la pestaña y catálogo alternativo cuando WebGL o la carga de la escena fallan.

## Referencias visuales

La dirección de diseño toma como referencia los recorridos inmersivos de CSS Design Awards: [20 Years of Xbox Museum](https://www.cssdesignawards.com/woty2021/sites/20-years-of-xbox-museum) y [EXPO 58](https://www.cssdesignawards.com/sites/expo-58-immersive-experience/43934). El templo y las animaciones se construyen específicamente para este portafolio.

## Comprobación

```bash
for f in *.js; do node --check $f; done
npm test
git diff --check
```

Verifica también en el navegador la entrada, el paso por las puertas, las fichas y el contacto. La fluidez depende de la GPU del dispositivo; comprobar el diseño a tamaño móvil no sustituye una prueba en un teléfono real.

Los archivos `style.css`, `script.js` y `docs/adr/` conservan la implementación y las decisiones de la versión anterior; la página actual utiliza los archivos `museum.*`, `greek-temple.js`, `motion.js`, `cinematic.js`, `layout.js`, `textures.js`, `free-camera.js` y `navigation.js`.
