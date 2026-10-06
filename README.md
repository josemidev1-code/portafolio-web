# Portafolio de José Miguel Miralles Gandia

Un museo digital de inspiración griega para explorar proyectos web y aplicaciones. El recorrido comienza ante un templo dórico al anochecer y atraviesa sus salas con la rueda del ratón o deslizando hacia arriba en el móvil.

## Qué hace cada tecnología

- **HTML** (`index.html`): contenido, navegación, fichas de proyectos y contacto.
- **CSS** (`museum.css`): tipografía (Cinzel para los títulos, Cormorant Garamond para los acentos e Instrument Sans para el texto), composición, paneles, transiciones y adaptación a móvil.
- **JavaScript y Three.js** (`museum.js`): escena 3D, cámara, recorrido e interacción. Three.js dibuja la escena utilizando WebGL.
- **Arquitectura** (`greek-temple.js`): pórtico dórico hexástilo sobre crepidoma, columnas de veinte estrías con éntasis, anillos, equino y ábaco, entablamento con triglifos, gotas y mútulos, frontón con escudo y corona de olivo, acroteras, muros de sillería con zócalo de ortostatos, techo de casetones pintados con estrellas doradas, lucernarios con haces de luz, puertas de bronce y cielo crepuscular.
- **Materiales** (`materials.js`): mármol veteado, sillería, losas y bronce con pátina, generados en canvas con ruido periódico (color, rugosidad y relieve) y proyectados en metros reales para que no se estiren.
- **Atenea** (`athena.js`, `assets/athena/`): escaneo 3D de una Atenea clásica de mármol, con mapas de normales, oclusión y rugosidad, una corona de olivo de bronce dorado, un broche en el hombro, un pedestal y un foco propio con sombra. Procedencia y licencia en `assets/athena/README.md`.
- **Fuego** (`fire.js`): braseros trípode de bronce, llamas con ruido animado en el sombreador (cinco capas con ritmos propios), brasas, humo y luz que titila de forma irregular.
- **Cerámica** (`pottery.js`): ánfora de cuello, ánfora de vientre, crátera de cáliz e hidria, con figuras negras o rojas, grecas, lengüetas, rayos y desgaste pintados en canvas.
- **Cámara libre en PC** (`free-camera.js`, `navigation.js`): WASD, mirada al arrastrar el ratón, Q/E para altura, Mayús para correr y Esc para regresar al recorrido. Incluye límites de fachada, puertas y urnas.
- **Ambientación** (`mythology.js`): placas de bronce de Atenea, Hermes y Hefesto y estandartes carmesí.
- **Renderizado** (`cinematic.js`): oclusión ambiental en pantalla y desenfoque de cámara calculados con la profundidad. Los textos y botones permanecen nítidos.
- **Movimiento** (`motion.js`): amortiguación del avance y curvas de aceleración, independientes de la tasa de fotogramas.

Three.js 0.169.0 se carga desde jsDelivr y las tipografías desde Google Fonts. Se necesita conexión a Internet para estas dependencias. Las geometrías y texturas del edificio se generan en la página; el único recurso descargado es la escultura (unos 2,5 MB en ordenador y 1,6 MB en móvil).

## Ejecutar en local

Desde la carpeta del repositorio:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`. Usa un servidor HTTP para cargar los módulos de JavaScript.

## Recorrido

- Entrada exterior con pórtico dórico, escalinata, braseros encendidos y el nombre del autor grabado en el arquitrabe.
- Sala I presidida por la escultura de Atenea; cerámica ática distinta en cada sala, estandartes carmesí y contraste entre fuego cálido y luz fría del cielo, con la atmósfera y la escala del God of War griego como referencia.
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
for f in museum.js greek-temple.js materials.js fire.js pottery.js athena.js mythology.js cinematic.js; do node --check $f; done
npm test
git diff --check
```

Verifica también en el navegador la entrada, el paso por las puertas, las fichas y el contacto. La fluidez depende de la GPU del dispositivo; comprobar el diseño a tamaño móvil no sustituye una prueba en un teléfono real.

Los archivos `style.css`, `script.js` y `docs/adr/` conservan la implementación y las decisiones de la versión anterior; la página actual utiliza los archivos `museum.*`, `greek-temple.js`, `motion.js`, `cinematic.js`, `mythology.js`, `free-camera.js` y `navigation.js`.
