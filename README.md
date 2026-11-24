# Portafolio de José Miguel Miralles Gandia

La portada abre directamente un museo 3D. El plano lleva a cada sala, al pórtico y al contacto. El catálogo HTML de `catalogo.html` también permite consultar los proyectos sin JavaScript ni WebGL.

Un museo digital de inspiración griega, ambientado en la saga griega de God of War, para explorar proyectos web y aplicaciones. El recorrido empieza en el ágora de Atenas, ante un muro con mi presentación grabada en piedra. Después cruza el Partenón y sus tres salas, cada una presidida por un dios. Se avanza con la rueda del ratón o deslizando hacia arriba en el móvil.

## Qué hace cada tecnología

- **HTML** (`index.html`): museo inmersivo, navegación, fichas de proyectos y contacto. El catálogo ligero usa `catalogo.css` y tipografías del sistema.
- **CSS** (`museum.css`): tipografía local con alternativas de sistema, composición, paneles, transiciones y adaptación a móvil.
- **JavaScript y Three.js** (`museum.js`): escena 3D, cámara, recorrido e interacción. Three.js dibuja la escena utilizando WebGL.
- **Arquitectura** (`greek-temple.js`): pórtico dórico hexástilo sobre crepidoma, columnas de veinte estrías con éntasis, anillos, equino y ábaco, entablamento con triglifos, gotas y mútulos, frontón con escudo y corona de olivo, acroteras, muros de sillería con zócalo de ortostatos, techo de casetones pintados con estrellas doradas, lucernarios con haces de luz, puertas de bronce y cielo crepuscular.
- **Materiales** (`materials.js`): mármol veteado, sillería, losas y bronce con pátina, con mapas WebP horneados (color, rugosidad y relieve) y proyectados en metros reales para que no se estiren.
- **Dioses** (`gods.js`): una escultura por sala, con pedestal, inscripción griega, focos propios y una ficha interactiva (quiénes eran, su papel en God of War y por qué están aquí).
  - Sala I: busto de Atenea a partir del GLB aportado por el autor, con material de caliza, labios suavizados e iris retocados. Las versiones de escritorio y ligera tienen 43.911 y 28.645 triángulos y ocupan 652 y 303 KiB. El relieve de pared se conserva en `assets/atenea-relieve/`.
  - Sala II: Hermes, escaneado (`assets/hermes/`).
  - Sala III: Hefesto, modelado (`assets/hefesto/`).
- **Ágora y Atenas** (`athens.js`): plaza con mosaico, cipreses, propileo y el muro grabado con mi presentación (interactivo). Alrededor, Atenas sobre colinas con casas, templos menores, cipreses y luces de ventanas al anochecer.
- **Fuego** (`fire.js`): braseros trípode de bronce, llamas con ruido animado en el sombreador (cinco capas en detalle alto y dos en compacto), brasas, humo y luz que titila de forma irregular.
- **Cerámica** (`pottery.js`): ánfora de cuello, ánfora de vientre, crátera de cáliz e hidria, con figuras negras o rojas, grecas, lengüetas, rayos y desgaste horneados en texturas locales.
- **Cámara libre en PC** (`free-camera.js`, `navigation.js`): WASD, mirada al arrastrar el ratón, Q/E para altura, Mayús para correr y Esc para regresar al recorrido. Incluye límites de fachada, puertas y urnas.
- **Ambientación** (`mythology.js`): placas de bronce de Hermes y Hefesto (el relieve de Atenea ocupa su muro) y estandartes carmesí.
- **Renderizado** (`cinematic.js`): oclusión ambiental en pantalla y desenfoque de cámara calculados con la profundidad. Los textos y botones permanecen nítidos.
- **Calidad gráfica** (`quality.js`): el modo automático arranca con geometría compacta, limita el dibujo a 30 fps y ajusta la resolución si el equipo va justo. El selector permite elegir otro nivel. En movimiento reducido se dibuja al navegar o cargar recursos. Si WebGL falla, se pierde el contexto o el arranque supera 18 segundos, se abre `recorrido.html`, una visita a las mismas salas mediante capturas del museo. También se puede abrir desde «Visita ligera».
- **Movimiento** (`motion.js`): amortiguación del avance y curvas de aceleración, independientes de la tasa de fotogramas.

Three.js 0.169.0 y el decodificador Draco se sirven desde `vendor/three/`. Las esculturas se solicitan por proximidad a su sala. La piedra, el bronce, los murales y la cerámica utilizan imágenes WebP locales. El modo compacto reduce las texturas y la geometría. El motor limita la resolución de la imagen y el número de luces locales, y pausa el render cuando se abre una ficha o se oculta la pestaña.

La vía central de piedra roja conecta las tres salas. `salas.js` sitúa vitrinas y esculturas y comparte sus posiciones con las colisiones. Los enlaces `?sala=atenea`, `?sala=hermes` y `?sala=hefesto` abren una sala directamente.

## Ejecutar en local

Desde la carpeta del repositorio:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`. Usa un servidor HTTP para cargar los módulos de JavaScript.

## Recorrido

- Ágora con el muro grabado: nombre, estudios (1.º de DAM en el IES Dr. Lluís Simarro) y lo que busco. Se puede abrir como ficha con «Sobre mí».
- Partenón con ΠΑΡΘΕΝΩΝ grabado en el arquitrabe, medallón con una omega dorada en el frontón, puertas de bronce y braseros encendidos.
- Un dios por sala (Atenea, Hermes y Hefesto), cerámica ática distinta en cada sala, estandartes carmesí y contraste entre fuego cálido y luz fría del cielo, con la atmósfera y la escala del God of War griego como referencia.
- Rótulos de sala legibles que permanecen durante la llegada y el comienzo de cada sala.
- Puertas que se abren al acercarse y se cierran al retroceder.
- Tres salas con urnas, proyectos y fichas ampliadas.
- Recorrido continuo sin pausas rígidas entre salas, amortiguación conectada al bucle de cámara y curvas monótonas que conservan la velocidad.
- Desenfoque limitado a diez píxeles durante el movimiento, desactivado al solicitar movimiento reducido.
- Sol que entra por los lucernarios, focos sobre urnas y escultura, sombras PCF suaves, sombras de contacto, oclusión ambiental y reflejos de entorno moderados.
- En ordenador se puede alternar entre recorrido guiado y cámara libre. En móvil se mantiene el recorrido por deslizamiento.
- Navegación por rueda, deslizamiento nativo, botones del plano y teclado.
- Encuadre vertical específico y menor resolución gráfica en móvil. El efecto utiliza tres muestras en móvil y cinco en ordenador.
- Arquitectura estática agrupada por material y una luz principal con sombras; las vitrinas evitan el renderizado extra de transmisión.
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

Los archivos `style.css`, `script.js` y `docs/adr/` conservan la implementación y las decisiones de la versión anterior; la página actual utiliza los archivos `museum.*`, `greek-temple.js`, `motion.js`, `cinematic.js`, `mythology.js`, `free-camera.js` y `navigation.js`.
