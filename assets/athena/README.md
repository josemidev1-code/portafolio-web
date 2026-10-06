# Escultura de Atenea — procedencia y licencia

## Origen

- **Escaneo:** «Athena», del proyecto [Three D Scans](http://threedscans.com/) de Oliver Laric, que publica escaneos 3D de esculturas de museos.
- **Versión optimizada:** [keijiro/ThreeDScans](https://github.com/keijiro/ThreeDScans), en `Assets/ThreeDScans/Athena/` (commit `d7c6be2`). La malla se diezmó y se le volvió a hacer la topología en Houdini. Los mapas de normales, oclusión y curvatura se hornearon con xNormal a partir del escaneo original.

## Licencia

Three D Scans publica sus escaneos para usarlos libremente, sin restricciones de copyright, con fines comerciales o no comerciales. Así lo recoge el README de keijiro/ThreeDScans, que remite a la página de información de Three D Scans (<http://threedscans.com/info/>). Se agradece citar el proyecto, y este archivo lo hace.

> Durante la preparación no se pudo abrir threedscans.com desde el entorno de trabajo, porque la red lo bloqueaba. Conviene revisar esa página antes de publicar para confirmar que las condiciones no han cambiado.

## Modificaciones para este portafolio

| Archivo | Contenido |
| --- | --- |
| `athena.glb` | Malla convertida de FBX a glTF binario, con los vértices soldados (unos 20 000), la base en el origen y la altura normalizada a 1. |
| `athena-normal.jpg` / `-1k.jpg` | Mapa de normales original de 4096 px reducido a 2048 y a 1024 px. |
| `athena-ao.jpg` | Oclusión ambiental reducida a 1024 px. |
| `athena-albedo.jpg` / `-1k.jpg` | Color de mármol cálido generado aquí, con suciedad en los huecos (a partir de la curvatura) y oclusión suave. |
| `athena-roughness.jpg` | Rugosidad derivada de la curvatura: más mate en las cavidades y más pulida en los relieves. |

La corona de olivo de bronce dorado y el broche del hombro no forman parte del escaneo. Se generan en `athena.js` a partir de la referencia de retrato del encargo, y la corona se ajusta al borde real del casco medido en la malla.
