"""Escaneo STL del SMK -> GLB del museo: orientado (Z arriba, frente a -Y), 1 unidad de alto,
base en 0 (o dorso en 0 si es relieve), reducido, con oclusión ambiental horneada y Draco."""
import bpy, sys, math, os
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
src, dst, rx, rz, kind = a[0], a[1], float(a[2]), float(a[3]), a[4]
tris = [int(x) for x in a[5].split(',')]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.stl_import(filepath=src)
o = bpy.context.selected_objects[0]; bpy.context.view_layer.objects.active = o
o.rotation_euler = (math.radians(rx), 0, math.radians(rz)); bpy.ops.object.transform_apply(rotation=True, scale=True)
vs = [v.co for v in o.data.vertices]
mn = Vector([min(v[i] for v in vs) for i in range(3)]); mx = Vector([max(v[i] for v in vs) for i in range(3)])
H = mx.z - mn.z; cx = (mn.x + mx.x) / 2
cy = mx.y if kind == 'relieve' else (mn.y + mx.y) / 2
for v in o.data.vertices: v.co = Vector(((v.co.x - cx) / H, (v.co.y - cy) / H, (v.co.z - mn.z) / H))
o.data.update()
print('proporciones ancho/alto/fondo', round((mx.x - mn.x) / H, 3), 1, round((mx.y - mn.y) / H, 3))
for p in o.data.polygons: p.use_smooth = True
mat = bpy.data.materials.new('marble'); o.data.materials.clear(); o.data.materials.append(mat); o.name = 'marble'
sc = bpy.context.scene; sc.world = bpy.data.worlds.new('w'); sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.device = 'CPU'
base = o.data.copy()
for t, out in zip(tris, [dst + '.glb', dst + '-movil.glb']):
    o.data = base.copy()
    n0 = len(o.data.polygons)
    if n0 > t:
        d = o.modifiers.new('d', 'DECIMATE'); d.ratio = t / n0; d.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier='d')
    for ca in list(o.data.color_attributes): o.data.color_attributes.remove(ca)
    attr = o.data.color_attributes.new('AO', 'BYTE_COLOR', 'POINT'); o.data.color_attributes.active_color = attr
    sc.world.light_settings.distance = .1
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
    bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_texcoords=False, export_normals=True,
        export_vertex_color='ACTIVE', export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7, export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_color_quantization=8)
    print('exportado', out, len(o.data.polygons), os.path.getsize(out))
