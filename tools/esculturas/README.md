# Esculturas modeladas: Atenea de la sabiduría y Hefesto

Estos scripts generan las dos esculturas que no proceden de un escaneo. Se ejecutan con Blender usado como módulo de Python (`bpy`).

## Qué hace cada archivo

| Archivo | Función |
| --- | --- |
| `mh.py` | Carga la malla base de MakeHuman, aplica sus objetivos (rasgos y proporciones) y posa el cuerpo por *skinning* con el esqueleto por defecto. |
| `athena_def.py` / `hephaestus_def.py` | Rasgos, proporciones y pose de cada figura. Atenea sigue el retrato de referencia: óvalo, nariz griega, labios llenos y ojos almendrados. |
| `hair.py` | Mechones ondulados con raya al medio, que recorren el cráneo siguiendo un campo de flujo, y la corona de hojas. |
| `athena_build.py` | Atenea: quitón simulado como tela real (gravedad, colisiones y cinturón), mangas jónicas con dobladillo, broches, lanza, cabello y corona. |
| `hephaestus_build.py` | Hefesto: exomis simulada, barba rizada, píleo, martillo y yunque. |
| `export.py` | Une las piezas por material, reduce los polígonos, hornea la oclusión ambiental en el color de vértice y exporta un GLB con compresión Draco. |
| `bl.py` | Utilidades de escena, cámara y render de comprobación. |

## Uso

```bash
pip install bpy==5.0.1 numpy          # Python 3.11
git clone --depth 1 https://github.com/makehumancommunity/makehuman
export MH_DATA=$PWD/makehuman/makehuman/data
STAGE=all OUT=out/atenea python athena_build.py
SRC=out/atenea.blend DST=../../assets/atenea-sabiduria/atenea.glb TRIS=150000 python export.py
SRC=out/atenea.blend DST=../../assets/atenea-sabiduria/atenea-movil.glb TRIS=60000 python export.py
STAGE=all OUT=out/hefesto python hephaestus_build.py
SRC=out/hefesto.blend DST=../../assets/hefesto/hefesto.glb TRIS=110000 python export.py
SRC=out/hefesto.blend DST=../../assets/hefesto/hefesto-movil.glb TRIS=50000 python export.py
```

## Licencia de los recursos de partida

La malla base, los objetivos, el esqueleto y los ojos de MakeHuman se publican con licencia **CC0 1.0** desde septiembre de 2020 ([LICENSE.md de MakeHuman](https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md), apartado C). Todo lo demás se genera con estos scripts: el pelo, la barba, la corona, la ropa, los accesorios y la pose.
