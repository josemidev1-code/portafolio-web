"""Une, reduce y exporta una escultura (.blend) a GLB con oclusión ambiental horneada en el color de vértice."""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
import bpy, bl
from mathutils import Vector

SRC, DST = os.environ['SRC'], os.environ['DST']
TRIS = int(os.environ.get('TRIS', '150000')); SUBDIV = os.environ.get('SUBDIV', 'body,eyes').split(',')
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(SRC))
sc = bpy.context.scene

def select_only(objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]

for o in list(bpy.data.objects):
    if o.type in ('LIGHT', 'CAMERA'): bpy.data.objects.remove(o)
for o in list(bpy.data.objects):
    if o.type == 'CURVE':
        select_only([o]); bpy.ops.object.convert(target='MESH')
for o in list(bpy.data.objects):
    if o.type != 'MESH': continue
    if o.name in SUBDIV:
        m = o.modifiers.new('sub', 'SUBSURF'); m.levels = 1
    select_only([o])
    for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)

groups = {}
for o in bpy.data.objects:
    if o.type == 'MESH' and o.data.materials: groups.setdefault(o.data.materials[0].name, []).append(o)
joined = {}
for name, objs in groups.items():
    select_only(objs); bpy.ops.object.join(); joined[name] = bpy.context.object; joined[name].name = name

def tris(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)
marble = joined['marble']
n0 = tris(marble)
if n0 > TRIS:
    d = marble.modifiers.new('dec', 'DECIMATE'); d.ratio = TRIS / n0; d.use_collapse_triangulate = True
    select_only([marble]); bpy.ops.object.modifier_apply(modifier='dec')
print('triángulos mármol', n0, '->', tris(marble), 'oro', tris(joined['gold']) if 'gold' in joined else 0)

# Oclusión ambiental en color de vértice (Cycles).
sc.render.engine = 'CYCLES'; sc.cycles.samples = int(os.environ.get('AO_SAMPLES', '48'))
for o in joined.values():
    attr = o.data.color_attributes.new('AO', 'BYTE_COLOR', 'POINT'); o.data.color_attributes.active_color = attr
    try: o.data.color_attributes.render_color_index = list(o.data.color_attributes).index(attr)
    except Exception: pass
    sc.world.light_settings.distance = .12 if sc.world else None
    select_only([o])
    bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')

kw = dict(filepath=os.path.abspath(DST), export_format='GLB', export_apply=True, export_yup=True, export_texcoords=os.environ.get('TEXCOORDS') == '1', export_normals=True, export_materials='EXPORT')
try: bpy.ops.export_scene.gltf(**kw, export_vertex_color='ACTIVE', export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7, export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_color_quantization=8)
except TypeError as e:
    print('sin draco', e); bpy.ops.export_scene.gltf(**kw)
print('exportado', DST, os.path.getsize(DST))
