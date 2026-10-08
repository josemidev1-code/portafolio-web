# Portafolio de José Miguel Miralles Gandia

Un museo digital de inspiración griega, ambientado en la saga griega de God of War, para explorar proyectos web y aplicaciones. El recorrido empieza en el ágora de Atenas, ante un muro con mi presentación grabada en piedra. Después cruza el Partenón y sus tres salas, cada una presidida por un dios. Se avanza con la rueda del ratón o deslizando hacia arriba en el móvil.

## Qué hace cada tecnología

- **HTML** (`index.html`): contenido, navegación, fichas de proyectos y contacto.
- **CSS** (`museum.css`): tipografía (Cinzel para los títulos, Cormorant Garamond para los acentos e Instrument Sans para el texto), composición, paneles, transiciones y adaptación a móvil.
- **JavaScript y Three.js** (`museum.js`): escena 3D, cámara, recorrido e interacción. Three.js dibuja la escena utilizando WebGL.
- **Arquitectura** (`greek-temple.js`): pórtico dórico hexástilo sobre crepidoma, columnas de veinte estrías con éntasis, anillos, equino y ábaco, entablamento con triglifos, gotas y mútulos, frontón con escudo y corona de olivo, acroteras, muros de sillería con zócalo de ortostatos, techo de casetones pintados con estrellas doradas, lucernarios con haces de luz, puertas de bronce y cielo crepuscular.
- **Materiales** (`materials.js`): mármol veteado, sillería, losas y bronce con pátina, generados en canvas con ruido periódico (color, rugosidad y relieve) y proyectados en metros reales para que no se estiren.
- **Dioses** (`gods.js`): una escultura por sala, con pedestal, inscripción griega, focos propios y una ficha interactiva (quiénes eran, su papel en God of War y por qué están aquí).
  - Sala I: Atenea de la sabiduría, modelada para el museo a partir del retrato de referencia (`assets/atenea-sabiduria/`, scripts en `tools/esculturas/`), y Atenea guerrera, escaneada (`assets/athena/`).
  - Sala II: Hermes, escaneado (`assets/hermes/`).
  - Sala III: Hefesto, modelado (`assets/hefesto/`).
- **Ágora y Atenas** (`athens.js`): plaza con mosaico, cipreses, propileo y el muro grabado con mi presentación (interactivo). Alrededor, Atenas sobre colinas con casas, templos menores, cipreses y luces de ventanas al anochecer.
- **Fuego** (`fire.js`): braseros trípode de bronce, llamas con ruido animado en el sombreador (cinco capas con ritmos propios), brasas, humo y luz que titila de forma irregular.
- **Cerámica** (`pottery.js`): ánfora de cuello, ánfora de vientre, crátera de cáliz e hidria, con figuras negras o rojas, grecas, lengüetas, rayos y desgaste pintados en canvas.
- **Cámara libre en PC** (`free-camera.js`, `navigation.js`): WASD, mirada al arrastrar el ratón, Q/E para altura, Mayús para correr y Esc para regresar al recorrido. Incluye límites de fachada, puertas y urnas.
- **Ambientación** (`mythology.js`): placas de bronce de Atenea, Hermes y Hefesto y estandartes carmesí.
- **Renderizado** (`cinematic.js`): oclusión ambiental en pantalla y desenfoque de cámara calculados con la profundidad. Los textos y botones permanecen nítidos.
- **Calidad gráfica** (`quality.js`): al cargar se lee la tarjeta gráfica, los núcleos y la memoria del equipo y se elige calidad alta, media o baja. Si después no se alcanzan unos 30 fps, baja un nivel (y luego la resolución) y lo recuerda para la próxima visita. El botón «Gráficos» permite fijarla a mano. La calidad baja pinta la escena sin posproceso, a menor resolución, con menos luces de relleno y con sombras que se recalculan cada pocos fotogramas, y carga la geometría y las esculturas ligeras.
- **Movimiento** (`motion.js`): amortiguación del avance y curvas de aceleración, independientes de la tasa de fotogramas.

Three.js 0.169.0 se carga desde jsDelivr y las tipografías desde Google Fonts. Se necesita conexión a Internet para estas dependencias. Las geometrías y texturas del edificio y de la ciudad se generan en la página. Solo se descargan las esculturas: unos 5,3 MB en ordenador y 3,2 MB en móvil, con modelos comprimidos con Draco.

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
