"""Convierte la malla generada en una estatua lista para el museo: Z arriba, de frente a -Y (=+Z en glTF),
1 unidad de alto con la base en 0, sin restos sueltos, alisada y guardada como .blend con material 'marble'."""
import bpy, bmesh, sys, os, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
src, dst, rx, rz = a[0], a[1], float(a[2]), float(a[3])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=src)
o = bpy.context.selected_objects[0]; bpy.context.view_layer.objects.active = o
o.rotation_euler = (math.radians(rx), 0, math.radians(rz)); bpy.ops.object.transform_apply(rotation=True)
bm = bmesh.new(); bm.from_mesh(o.data)
# Quedarse con la pieza más grande (el generador deja islas sueltas).
seen = set(); comps = []
for f in bm.faces:
    if f.index in seen: continue
    stack = [f]; comp = []; seen.add(f.index)
    while stack:
        g = stack.pop(); comp.append(g)
        for e in g.edges:
            for h in e.link_faces:
                if h.index not in seen: seen.add(h.index); stack.append(h)
    comps.append(comp)
comps.sort(key=len, reverse=True); print('piezas', [len(c) for c in comps[:5]])
keep = set(f.index for f in comps[0])
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.index not in keep], context='FACES')
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
bm.normal_update(); bm.to_mesh(o.data); bm.free()
vs = [v.co for v in o.data.vertices]
zmin = min(v.z for v in vs); zmax = max(v.z for v in vs); H = zmax - zmin
low = [v for v in vs if v.z < zmin + H * .5]
cx = sum(v.x for v in low) / len(low); cy = sum(v.y for v in low) / len(low)
for v in o.data.vertices: v.co = Vector(((v.co.x - cx) / H, (v.co.y - cy) / H, (v.co.z - zmin) / H))
m = o.modifiers.new('s', 'SMOOTH'); m.factor = float(os.environ.get('SMOOTH_F', '.5')); m.iterations = int(os.environ.get('SMOOTH_I', '2'))
bpy.ops.object.modifier_apply(modifier='s')
for p in o.data.polygons: p.use_smooth = True
mat = bpy.data.materials.new('marble'); o.data.materials.clear(); o.data.materials.append(mat); o.name = 'marble'
w = bpy.data.worlds.new('w'); bpy.context.scene.world = w
print('caras', len(o.data.polygons))
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(dst))
