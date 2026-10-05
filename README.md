# Museo Josemi — Portafolio de José Miguel Miralles Gandia

Un museo digital de inspiración griega para explorar proyectos web y aplicaciones. El recorrido comienza ante un templo de mármol y atraviesa sus salas con la rueda del ratón o deslizando hacia arriba en el móvil.

## Qué hace cada tecnología

- **HTML** (`index.html`): contenido, navegación, fichas de proyectos y contacto.
- **CSS** (`museum.css`): tipografía, composición, paneles, transiciones y adaptación a móvil.
- **JavaScript y Three.js** (`museum.js`): escena 3D, cámara, recorrido e interacción. Three.js dibuja la escena utilizando WebGL.
- **Arquitectura** (`greek-temple.js`): columnas con éntasis y capiteles, grecas, frontón, mármol, marcos biselados y puertas con rosetas de bronce.
- **Movimiento** (`motion.js`): amortiguación del avance y curvas de aceleración, independientes de la tasa de fotogramas.

Three.js 0.169.0 se carga desde jsDelivr y las tipografías desde Google Fonts. Se necesita conexión a Internet para estas dependencias; las geometrías y texturas del edificio se generan en la página.

## Ejecutar en local

Desde la carpeta del repositorio:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`. Usa un servidor HTTP para cargar los módulos de JavaScript.

## Recorrido

- Entrada exterior con pórtico dórico y detalles de bronce.
- Puertas que se abren al acercarse y se cierran al retroceder.
- Tres salas con urnas, proyectos y fichas ampliadas.
- Recorrido de entrada más largo, aceleración y frenado progresivos, e inversión del gesto sin saltos.
- Luz cálida, sombras suavizadas también en móvil, sombras de contacto y reflejos de entorno en los materiales.
- Navegación por rueda, deslizamiento nativo, botones del plano y teclado.
- Encuadre vertical específico y menor resolución gráfica en móvil.
- Respeto de la preferencia de movimiento reducido, pausa al ocultar la pestaña y catálogo alternativo cuando WebGL o la carga de la escena fallan.

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

Los archivos `style.css`, `script.js` y `docs/adr/` conservan la implementación y las decisiones de la versión anterior; la página actual utiliza los archivos `museum.*` y `greek-temple.js`.
