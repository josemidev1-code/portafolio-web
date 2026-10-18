# Atenea y museo: revisión local

Se conserva el historial original en Git. Rama de trabajo: `codex/atenea-museo`.
No se ha publicado ni enviado ningún cambio al repositorio remoto.

## Escultura

Fuente editable: `outputs/atenea-reconstruida.blend`. Se reconstruye desde la
base anatómica de MakeHuman, en lugar de intentar recuperar detalle del GLB
suavizado. Se han ajustado óvalo, mentón, nariz, ojos y cejas; añadido iris
geométricos, mechones con raya central y un laurel lateral más pequeño.

Es una primera interpretación: **el parecido con el dibujo todavía no está
resuelto**. El pelo, la ropa y las proporciones requieren dirección artística
adicional. Un único frontal tampoco determina la forma exacta del perfil y
la parte posterior. No es un archivo preparado ni validado para impresión 3D.

Revisión comparativa: `http://127.0.0.1:8001/estudio-atenea.html`.
La referencia local está en `outputs/referencia.png`, excluida de Git.
También se entrega `outputs/atenea-visor.html`, con modelo y referencia
embebidos, para abrir en un navegador sin servidor local. Requiere conexión
para Three.js y el decodificador Draco. La navegación al museo sí requiere
arrancar el servidor.

Los GLB se normalizan por altura del cuerpo; la lanza puede sobrepasarla.
Hay dos materiales agrupados y dos niveles de detalle. Los presupuestos se
aplican por pieza para reservar polígonos a cabeza, ojos y pelo. El informe
de tamaño y triángulos se guarda en `outputs/atenea-export.json`.

## Arquitectura implementada

Ágora → propileo con puerta → galería de Atenea → patio de Hermes → galería
de Hefesto → salida. Se conserva el edificio de doce metros de ancho y el
recorrido de proyectos existente, con un primer cambio de distribución.

- Únicamente la fachada mantiene hojas abatibles, que abren hacia la plaza.
- Los umbrales interiores de 8,2 m quedan abiertos, sin barrido de puertas.
- Las esculturas pasan a x = −3,65 m y a los centros z = −6,5 / −18,5 / −30,5 m.
- Fondos y columnas laterales forman espacios propios para los dioses.
- El patio central abre un hueco de 8 × 10 m en la cubierta, entre z = −12,05
  y −22,05. Conserva los pórticos laterales de dos metros.
- Mármol cálido con vetas más discretas, rojo oscuro y bronce; luz de cielo
  frente a fuego cálido para sostener la referencia visual al God of War griego.

Esta es una primera revisión del museo existente, no una reconstrucción
completa ni una reproducción exacta de un escenario del juego.

## Rendimiento y comprobación

Se reutilizan las listas de obstáculos y objetivos de interacción, se sustituye
la búsqueda repetida de propietarios por un Map y se limita la selección por
rayos a 30 Hz. Se conservan el gobernador de calidad y la compresión Draco.
No se afirma una mejora porcentual de FPS sin medir en equipos equivalentes.

Comprobación: sintaxis de los módulos, `npm test`, `git diff --check`, carga
en navegador y revisión de las salas. La movilidad física, el perfil completo
del recorrido y el comportamiento en un teléfono real requieren más pruebas.

## Reproducir

MakeHuman oficial en `../work/makehuman/makehuman/data`. Blender 5.2 instalado.
Desde PowerShell, con rutas absolutas:

```powershell
$env:MH_DATA = 'C:/Users/soyjo/Documents/ChatGPT/MODELOS3D/work/makehuman/makehuman/data'
$env:OUT = 'C:/Users/soyjo/Documents/ChatGPT/MODELOS3D/museo/outputs/atenea-reconstruida'
$env:STAGE = 'all'
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' -b --python tools/esculturas/athena_build.py
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' -b --python tools/esculturas/export_web.py
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' -b --python tools/esculturas/portrait.py
python -m http.server 8001 --bind 127.0.0.1
```

El exportador deja los nuevos GLB en `outputs/`; su integración en
`assets/atenea/` se realiza después de revisarlos. Los originales se conservan
en Git y en `outputs/originales/`.
