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

## Atenea a partir de la hoja de referencia (Hunyuan3D)

La Atenea actual (`assets/atenea/`) se genera con Hunyuan3D-2mv a partir de las vistas frontal, de perfil y trasera de la hoja de referencia del cuerpo. Como en esa hoja la cara mide pocos píxeles, antes se pega encima el rostro frontal de la hoja de la cabeza, alineado por los ojos.

| Archivo | Función |
| --- | --- |
| `atenea_compone_vista.py` | Amplía la vista frontal del cuerpo, pega el rostro en alta resolución y quita el fondo. |
| `atenea_hunyuan.py` | Genera la malla con Hunyuan3D-2mv turbo en CPU (guarda los latentes para poder repetir solo la extracción). |
| `atenea_a_marmol.py` | Orienta la malla, la deja a 1 unidad de alto con la base en 0, quita restos sueltos y la alisa. |

```bash
python atenea_compone_vista.py                              # in/mv_front.png (+ mv_left, mv_back)
RES=380 python atenea_hunyuan.py                            # out/hy/mesh.obj
python atenea_a_marmol.py -- out/hy/mesh.obj out/hy/estatua.blend 90 0
SRC=out/hy/estatua.blend DST=../../assets/atenea/atenea.glb TRIS=180000 SUBDIV=none python export.py
```

## Colección: escaneos del SMK

`escaneo_smk.py` convierte los STL de la Colección Real de Vaciados del SMK (dominio público, `api.smk.dk`) en GLB del museo: los gira (Z arriba, frente a −Y), los deja a 1 unidad de alto (los relieves, con el dorso en 0), reduce los polígonos, hornea la oclusión ambiental y exporta la versión de ordenador y la de móvil.

```bash
python escaneo_smk.py -- KAS499_small.stl ../../assets/piezas/gladiador-borghese 0 0 estatua 120000,40000
python escaneo_smk.py -- KAS19-8_small.stl ../../assets/piezas/atenea-pergamo 90 0 relieve 140000,50000
```
