# Museo Josemi — Portafolio de José Miguel Miralles Gandia

Un museo digital de inspiración griega para explorar proyectos web y aplicaciones. El recorrido comienza ante un templo de mármol y atraviesa sus salas con la rueda del ratón o deslizando hacia arriba en el móvil.

## Qué hace cada tecnología

- **HTML** (`index.html`): contenido, navegación, fichas de proyectos y contacto.
- **CSS** (`museum.css`): tipografía, composición, paneles, transiciones y adaptación a móvil.
- **JavaScript y Three.js** (`museum.js`): escena 3D, cámara, recorrido e interacción. Three.js dibuja la escena utilizando WebGL.
- **Arquitectura** (`greek-temple.js`): columnas con éntasis y capiteles, grecas, frontón, mármol, marcos biselados y puertas con rosetas de bronce.
- **Cámara libre en PC** (`free-camera.js`, `navigation.js`): WASD, mirada al arrastrar el ratón, Q/E para altura, Mayús para correr y Esc para regresar al recorrido. Incluye límites de fachada, puertas y urnas.
- **Ambientación** (`mythology.js`): cerámica, pebeteros animados y paneles de Atenea, Hermes y Hefesto.
- **Renderizado** (`cinematic.js`): desenfoque de cámara calculado con profundidad; los textos y botones permanecen nítidos.
- **Movimiento** (`motion.js`): amortiguación del avance y curvas de aceleración, independientes de la tasa de fotogramas.

Three.js 0.169.0 se carga desde jsDelivr y las tipografías desde Google Fonts. Se necesita conexión a Internet para estas dependencias; las geometrías y texturas del edificio se generan en la página.

## Ejecutar en local

Desde la carpeta del repositorio:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`. Usa un servidor HTTP para cargar los módulos de JavaScript.

## Recorrido

- Entrada exterior con pórtico dórico, omega de bronce rojo modelado en 3D y piedra envejecida.
- Estandartes carmesí, ánforas con asas simétricas unidas al cuello y al hombro, y contraste entre fuego cálido y ambiente frío, inspirados en el God of War griego.
- Puertas que se abren al acercarse y se cierran al retroceder.
- Tres salas con urnas, proyectos y fichas ampliadas.
- Recorrido continuo sin pausas rígidas entre salas, amortiguación conectada al bucle de cámara y curvas monótonas que conservan la velocidad.
- Desenfoque limitado a diez píxeles durante el movimiento, desactivado al solicitar movimiento reducido.
- Luz cálida, sombras suavizadas también en móvil, sombras de contacto y reflejos de entorno en los materiales.
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
node --check museum.js
node --check greek-temple.js
npm test
git diff --check
```

Verifica también en el navegador la entrada, el paso por las puertas, las fichas y el contacto. La fluidez depende de la GPU del dispositivo; comprobar el diseño a tamaño móvil no sustituye una prueba en un teléfono real.

Los archivos `style.css`, `script.js` y `docs/adr/` conservan la implementación y las decisiones de la versión anterior; la página actual utiliza los archivos `museum.*`, `greek-temple.js`, `motion.js`, `cinematic.js`, `mythology.js`, `free-camera.js` y `navigation.js`.
