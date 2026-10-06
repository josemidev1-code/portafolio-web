"""Utilidades de Blender (bpy) para construir, renderizar y exportar las esculturas."""
import bpy, bmesh, numpy as np, math
from mathutils import Vector


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 24
    try: sc.cycles.use_denoising = True
    except Exception: pass
    sc.render.resolution_x = sc.render.resolution_y = 640
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (.035, .033, .03, 1)
    return sc


def mesh_from(name, v, faces, uv=None, ftex=None, smooth=True):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(p) for p in v], [], faces); me.update()
    if uv is not None and ftex is not None:
        layer = me.uv_layers.new(name='UVMap'); k = 0
        for poly, ft in zip(me.polygons, ftex):
            for li, t in zip(poly.loop_indices, ft): layer.data[li].uv = uv[t] if t >= 0 else (0, 0)
    for p in me.polygons: p.use_smooth = smooth
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob); return ob


def marble(name='marble', color=(.86, .83, .78)):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = .42
    try:
        b.inputs['Subsurface Weight'].default_value = .12; b.inputs['Subsurface Radius'].default_value = (.4, .3, .25)
    except Exception: pass
    return m


def light_rig(target=(0, 0, 0), dist=6, energy=900):
    t = Vector(target)
    for pos, e, size in [((1.0, -1.1, .9), 1.0, 2.5), ((-1.2, -.6, .3), .25, 4), ((-.3, 1.2, .8), .5, 2)]:
        L = bpy.data.lights.new('L', 'AREA'); L.energy = energy * e; L.size = size
        o = bpy.data.objects.new('L', L); o.location = t + Vector(pos) * dist; bpy.context.collection.objects.link(o)
        d = t - o.location; o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def camera(loc, look, lens=85):
    c = bpy.data.cameras.new('C'); c.lens = lens; c.clip_start = .01; c.clip_end = 500
    o = bpy.data.objects.new('C', c); o.location = loc; bpy.context.collection.objects.link(o)
    o.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); bpy.context.scene.camera = o; return o


def render(path, res=640, samples=24):
    sc = bpy.context.scene; sc.render.resolution_x = sc.render.resolution_y = res; sc.cycles.samples = samples
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)


def subdivide(ob, levels=1):
    m = ob.modifiers.new('sub', 'SUBSURF'); m.levels = levels; m.render_levels = levels
