"""Construye la Atenea de mármol: cuerpo posado, quitón simulado, cabello ondulado, corona de hojas, broche y lanza."""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
import numpy as np, math, bpy, bmesh, mh, bl, hair, athena_def as A
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

STAGE = os.environ.get('STAGE', 'all')
OUT = os.environ.get('OUT', 'out/athena')
S = .1  # unidades de MakeHuman (dm) a metros

v, vt, faces, ftex, groups = mh.load_base()
v = mh.apply(v, {**A.BODY, **A.FACE}); B = mh.joint_positions(v); W = mh.weights()
v2, B2, M = mh.pose(v, B, W, A.pose(mh, B))
ev, ef = mh.proxy(f'{mh.DATA}/eyes/high-poly/high-poly.mhclo', v)
# Los ojos siguen al hueso de la cabeza.
Mh = M['head']; ev = (np.c_[ev, np.ones(len(ev))] @ Mh.T)[:, :3]
cv = lambda a: np.c_[a[..., 0], -a[..., 2], a[..., 1]] * S
cp = lambda p: Vector((p[0] * S, -p[2] * S, p[1] * S))
body_f = [faces[i] for i, g in enumerate(groups) if g == 'body']
V = cv(v2); floor = V[:, 2].min()
V[:, 2] -= floor; ev = cv(ev); ev[:, 2] -= floor
J = {n: Vector((b['head'][0] * S, -b['head'][2] * S, b['head'][1] * S - floor)) for n, b in B2.items()}
JT = {n: Vector((b['tail'][0] * S, -b['tail'][2] * S, b['tail'][1] * S - floor)) for n, b in B2.items()}

sc = bl.reset(); mat = bl.marble()
body = bl.mesh_from('body', V, body_f); body.data.materials.append(mat)
eyes = bl.mesh_from('eyes', ev, ef); eyes.data.materials.append(mat)


def section(zlo, zhi, exclude_arms=True):
    """Medidas del cuerpo entre dos alturas (sin los brazos): centro y semiejes."""
    m = (V[:, 2] > zlo) & (V[:, 2] < zhi)
    if exclude_arms: m &= np.abs(V[:, 0]) < .21
    P = V[m]; c = Vector(P.mean(0))
    return c, (P[:, 0].max() - P[:, 0].min()) / 2, (P[:, 1].max() - P[:, 1].min()) / 2


def chiton():
    """Tubo de tela fijado bajo las axilas y ceñido bajo el pecho; la gravedad y las colisiones hacen los pliegues."""
    top_z = J['clavicle.L'].z - .1; belt_z = top_z - .17; hem_z = -.04
    NU, NV = 128, 150
    verts, pin_top, pin_belt = [], [], []
    dz = (top_z - hem_z) / (NV - 1)
    prof = []
    for j in range(NV):
        z = top_z - dz * j
        c, rx, ry = section(z - .05, z + .05, True) if z > .25 else section(.2, .3, True)
        if z < .1: rx, ry = rx + (.1 - z) * .8, ry + (.1 - z) * .8
        prof.append([z, c.x, c.y, rx, ry])
    prof = np.array(prof)
    # Perfil suavizado y holgura creciente hacia el bajo para que caigan pliegues verticales.
    for k in (3, 4):
        prof[:, k] = np.maximum.accumulate(prof[:, k]) * 0 + prof[:, k]
        prof[:, k] = np.convolve(np.pad(prof[:, k], 6, mode='edge'), np.ones(13) / 13, mode='valid')
    for j, (z, cx, cy, rx, ry) in enumerate(prof):
        if z > belt_z: m = .012 + .03 * (top_z - z) / (top_z - belt_z) * (1 - (top_z - z) / (top_z - belt_z)) * 4
        else:
            t = (belt_z - z) / (belt_z - hem_z); m = .01 + .05 * t + .08 * t * t
        pinned_belt = abs(z - belt_z) < dz * .6
        if pinned_belt: m = .008
        if j == 0: m = .01
        for i in range(NU):
            a = 2 * math.pi * i / NU
            pleat = (.02 if z < belt_z else .007) * (.6 + .4 * math.sin(a * 3 + 1.3)) * math.sin(a * 16 + 1.4 * math.sin(a * 4) + .9 * math.sin(a * 7 + 2)) if not (pinned_belt or j == 0) else 0
            verts.append((cx + (rx + m + pleat) * math.cos(a), cy + (ry + m * 1.1 + pleat) * math.sin(a), z))
        if j == 0: pin_top += range(j * NU, (j + 1) * NU)
        if pinned_belt: pin_belt += range(j * NU, (j + 1) * NU)
    fcs = [(j * NU + i, j * NU + (i + 1) % NU, (j + 1) * NU + (i + 1) % NU, (j + 1) * NU + i) for j in range(NV - 1) for i in range(NU)]
    me = bpy.data.meshes.new('chiton'); me.from_pydata(verts, [], fcs); me.update()
    ob = bpy.data.objects.new('chiton', me); bpy.context.collection.objects.link(ob)
    g = ob.vertex_groups.new(name='pin'); g.add(list(pin_top) + list(pin_belt), 1.0, 'REPLACE')
    return ob, belt_z, top_z


def simulate(cloth, frames=70):
    col = body.modifiers.new('col', 'COLLISION'); body.collision.thickness_outer = .006; body.collision.cloth_friction = 6
    m = cloth.modifiers.new('cloth', 'CLOTH'); s = m.settings
    s.quality = 7; s.mass = .25; s.tension_stiffness = 30; s.compression_stiffness = 30; s.shear_stiffness = 6; s.bending_stiffness = .6
    s.air_damping = 2; s.vertex_group_mass = 'pin'; s.pin_stiffness = 1
    m.collision_settings.distance_min = .006; m.collision_settings.use_self_collision = False
    bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, -.001)); fl = bpy.context.object; fl.modifiers.new('c', 'COLLISION'); fl.collision.cloth_friction = 20
    sc.frame_start = 1; sc.frame_end = frames
    m.point_cache.frame_start = 1; m.point_cache.frame_end = frames
    for f in range(1, frames + 1): sc.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get(); ev_ = cloth.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev_); cloth.modifiers.clear(); cloth.data = me
    body.modifiers.remove(col); bpy.data.objects.remove(fl)


top_z = None
if STAGE in ('cloth', 'all'):
    cl, belt_z, top_z = chiton(); print('alturas', top_z, belt_z, V[:, 2].max()); simulate(cl)
    sol = cl.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = .006; sol.offset = 1
    for p in cl.data.polygons: p.use_smooth = True
    cl.data.materials.append(mat)
    # Cinturón (zona) bajo el pecho.
    c, rx, ry = section(belt_z - .02, belt_z + .02)
    bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=.012, major_segments=96, minor_segments=8, location=(c.x, c.y, belt_z))
    belt = bpy.context.object; belt.scale = (rx + .03, ry + .035, 1); belt.data.materials.append(mat)

def to_world(P, bone='head'):
    """Puntos en reposo (MakeHuman) a la pose final en metros de Blender."""
    Q = (np.c_[P, np.ones(len(P))] @ M[bone].T)[:, :3]
    Q = cv(Q); Q[:, 2] -= floor; return Q


def build_hair():
    rng = np.random.default_rng(7)
    hw = np.array(W['head']); head_idx = hw[hw[:, 1] > .5, 0].astype(int)
    H = hair.Head(v, body_f, head_idx)
    paths = hair.lock_paths(H, rng, shoulder_y=B['upperarm01.L']['head'][1] - .2, n=44)
    cu = bpy.data.curves.new('hair', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 1; cu.bevel_resolution = 3; cu.resolution_u = 3
    for P, rad in paths:
        Q = to_world(P); sp = cu.splines.new('NURBS'); sp.points.add(len(Q) - 1); sp.use_endpoint_u = True; sp.order_u = 4
        for i, q in enumerate(Q):
            t = i / (len(Q) - 1); sp.points[i].co = (*q, 1); sp.points[i].radius = rad * S * (.75 + .5 * math.sin(math.pi * min(1, t * 1.3)) ) * (1 - .3 * t * t)
    ob = bpy.data.objects.new('hair', cu); bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.convert(target='MESH'); ob = bpy.context.object
    rm = ob.modifiers.new('rm', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = .0035
    sm = ob.modifiers.new('sm', 'SMOOTH'); sm.factor = .5; sm.iterations = 2
    bpy.ops.object.modifier_apply(modifier='rm'); bpy.ops.object.modifier_apply(modifier='sm')
    for p in ob.data.polygons: p.use_smooth = True
    ob.data.materials.append(mat)
    # Corona: hojas que se abren hacia arriba alrededor de la cabeza.
    ring = hair.wreath_ring(H, rng, 24)
    LV, LF = hair.leaf_mesh(.88, .27)
    allV, allF = [], []
    for row in range(2):
        for i, (p, d, phi) in enumerate(ring):
            up = np.array([0, 1., 0]); tang = np.array([math.cos(phi), 0, -math.sin(phi)])
            # Las hojas apuntan hacia la frente desde ambos lados, como una corona de laurel, y se abren hacia arriba.
            toward_front = -1 if math.sin(phi) > 0 else 1
            j = rng.uniform(-.25, .25)
            axis = up * (1.0 + .25 * row) + d * (.48 - .15 * row + j * .4) + tang * toward_front * (.42 - .15 * row + j * .5)
            axis /= np.linalg.norm(axis)
            normal = np.cross(axis, tang); normal /= np.linalg.norm(normal) + 1e-9
            if np.dot(normal, d) < 0: normal = -normal
            side = np.cross(normal, axis)
            sc_ = rng.uniform(.8, 1.2) * (1 - .15 * row)
            R = np.c_[side, axis, normal]
            base = p + d * (.02 * row - .05) - axis * .2 + tang * toward_front * (.08 if row else 0)
            P = (LV * sc_) @ R.T + base
            off = len(allV); allV += list(P); allF += [tuple(off + x for x in f) for f in LF]
    Q = to_world(np.array(allV))
    lo = bl.mesh_from('wreath', Q, allF); sol = lo.modifiers.new('s', 'SOLIDIFY'); sol.thickness = .0025; sol.offset = 0
    lo.data.materials.append(mat)
    # Banda de la corona.
    band = np.array([p for p, d, phi in ring] + [ring[0][0]])
    cb = bpy.data.curves.new('band', 'CURVE'); cb.dimensions = '3D'; cb.bevel_depth = .0045; cb.bevel_resolution = 2
    sp = cb.splines.new('NURBS'); Qb = to_world(band); sp.points.add(len(Qb) - 1); sp.use_cyclic_u = True; sp.order_u = 4
    for i, q in enumerate(Qb): sp.points[i].co = (*q, 1)
    bo = bpy.data.objects.new('band', cb); bpy.context.collection.objects.link(bo); bo.data.materials.append(mat)
    return ob


if STAGE in ('hair', 'all'):
    build_hair()


def dominant_bone():
    best = np.full(len(v), -1.0); name = np.empty(len(v), dtype=object)
    for n, lst in W.items():
        for i, w in lst:
            if w > best[i]: best[i] = w; name[i] = n
    return name


def build_yoke(top_z):
    """Parte alta del quitón: se genera desde la propia piel (hombros, pecho, espalda y mangas hasta el codo)
    separándola unos milímetros y plegándola en tablas finas."""
    dom = dominant_bone()
    keep_bones = {'spine01', 'spine02', 'spine03', 'clavicle.L', 'clavicle.R', 'shoulder01.L', 'shoulder01.R', 'upperarm01.L', 'upperarm01.R', 'upperarm02.L', 'upperarm02.R', 'breast.L', 'breast.R'}
    neck_z = J['neck01'].z + .005
    sel = np.array([(dom[i] in keep_bones) and V[i, 2] > top_z - .035 and V[i, 2] < neck_z for i in range(len(V))])
    fs = [f for f in body_f if all(sel[k] for k in f)]
    used = sorted({k for f in fs for k in f}); remap = {k: i for i, k in enumerate(used)}
    me = bpy.data.meshes.new('yoke'); me.from_pydata([tuple(V[k]) for k in used], [], [[remap[k] for k in f] for f in fs]); me.update()
    ob = bpy.data.objects.new('yoke', me); bpy.context.collection.objects.link(ob)
    me.calc_normals_split() if hasattr(me, 'calc_normals_split') else None
    for vert in me.vertices:
        n = vert.normal; p = vert.co
        ang = math.atan2(p.y - J['spine01'].y, p.x)
        pleat = .0045 * math.sin(p.x * 160 + 2 * math.sin(p.z * 40)) + .003 * math.sin(p.z * 120 + p.x * 30)
        vert.co = p + n * (.011 + pleat)
    # Bordes limpios: se suaviza el contorno (escote, mangas, bajo) y se añade un dobladillo enrollado.
    bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
    for _ in range(14):
        new = {}
        for vb in bm.verts:
            if not vb.is_boundary: continue
            nb = [e.other_vert(vb) for e in vb.link_edges if e.is_boundary]
            if len(nb) == 2: new[vb] = vb.co * .5 + (nb[0].co + nb[1].co) * .25
        for vb, co in new.items(): vb.co = co
    # Recorre los bordes para formar lazos ordenados.
    loops, seen = [], set()
    for e in bm.edges:
        if not e.is_boundary or e in seen: continue
        loop = [e.verts[0]]; cur, prev_e = e.verts[1], e; seen.add(e)
        while cur is not loop[0]:
            loop.append(cur)
            nxt = [x for x in cur.link_edges if x.is_boundary and x not in seen]
            if not nxt: break
            prev_e = nxt[0]; seen.add(prev_e); cur = prev_e.other_vert(cur)
        if len(loop) > 8: loops.append([vb.co.copy() for vb in loop])
    bm.to_mesh(me); bm.free()
    cu = bpy.data.curves.new('hem', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = .0055; cu.bevel_resolution = 2
    for L in loops:
        sp = cu.splines.new('NURBS'); sp.points.add(len(L) - 1); sp.use_cyclic_u = True; sp.order_u = 4
        for i, co in enumerate(L): sp.points[i].co = (*co, 1)
    hem = bpy.data.objects.new('hem', cu); bpy.context.collection.objects.link(hem); hem.data.materials.append(mat)
    for p_ in me.polygons: p_.use_smooth = True
    sol = ob.modifiers.new('s', 'SOLIDIFY'); sol.thickness = .005; sol.offset = 1
    ob.data.materials.append(mat)
    return ob


def brooch(pos, normal, r=.022, gold=None):
    g = []
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=.006, vertices=40, location=pos); d = bpy.context.object
    d.rotation_euler = Vector(normal).to_track_quat('Z', 'Y').to_euler(); g.append(d)
    bpy.ops.mesh.primitive_torus_add(major_radius=r * .78, minor_radius=r * .12, major_segments=48, minor_segments=8, location=Vector(pos) + Vector(normal) * .004)
    t = bpy.context.object; t.rotation_euler = d.rotation_euler; g.append(t)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r * .32, location=Vector(pos) + Vector(normal) * .005, segments=20, ring_count=10); g.append(bpy.context.object)
    for k in range(8):
        a = k * math.pi / 4; q = d.rotation_euler.to_matrix()
        off = q @ Vector((math.cos(a) * r * .55, math.sin(a) * r * .55, .004))
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r * .16, location=Vector(pos) + off, segments=12, ring_count=6); g.append(bpy.context.object)
    for o in g: o.data.materials.append(gold); [setattr(p, 'use_smooth', True) for p in o.data.polygons]
    return g


def surface_point(obj, origin, direction):
    dg = bpy.context.evaluated_depsgraph_get(); o = obj.evaluated_get(dg)
    inv = obj.matrix_world.inverted()
    ok, loc, nor, idx = o.ray_cast(inv @ Vector(origin), (inv.to_3x3() @ Vector(direction)).normalized())
    return (obj.matrix_world @ loc, (obj.matrix_world.to_3x3() @ nor).normalized()) if ok else (None, None)


if STAGE == 'all':
    gold = bpy.data.materials.new('gold'); gold.use_nodes = True
    gb = gold.node_tree.nodes['Principled BSDF']; gb.inputs['Base Color'].default_value = (.72, .52, .26, 1); gb.inputs['Metallic'].default_value = 1; gb.inputs['Roughness'].default_value = .32
    yoke = build_yoke(top_z)
    bpy.context.view_layer.update()
    # Broches: el principal en el hombro izquierdo (a la derecha del espectador), como en el retrato.
    for side, r in (('L', .026), ('R', .018)):
        sh = J[f'shoulder01.{side}']; o = sh + Vector((0, -.25, .06)); p, n = surface_point(yoke, o, Vector((0, 1, -.15)))
        if p: brooch(p + n * .006, n, r, gold)
        # Botones de la manga jónica a lo largo del brazo.
        ua, el = J[f'upperarm01.{side}'], J[f'lowerarm01.{side}']
        for t in (.25, .55):
            q = ua.lerp(el, t); o = q + Vector((0, 0, .3)); p, n = surface_point(yoke, o, Vector((0, 0, -1)))
            if p: brooch(p + n * .003, n, .008, gold)
    # Lanza de bronce en la mano izquierda.
    fist = sum((J[f'finger{k}-2.L'] for k in '2345'), Vector()) / 4
    shaft_top, shaft_bot = 2.42, .02
    bpy.ops.mesh.primitive_cylinder_add(radius=.012, depth=shaft_top - shaft_bot, vertices=24, location=(fist.x, fist.y, (shaft_top + shaft_bot) / 2))
    spear = bpy.context.object; spear.data.materials.append(gold)
    blade = [(0, 0), (.028, .05), (.034, .12), (.022, .2), (0, .27)]
    bpy.ops.mesh.primitive_cone_add(radius1=.03, radius2=0, depth=.26, vertices=4, location=(fist.x, fist.y, shaft_top + .13))
    tip = bpy.context.object; tip.scale = (1, .25, 1); tip.data.materials.append(gold)
    bpy.ops.mesh.primitive_torus_add(major_radius=.016, minor_radius=.005, location=(fist.x, fist.y, shaft_top)); bpy.context.object.data.materials.append(gold)
    # Plinto circular integrado.
    bpy.ops.mesh.primitive_cylinder_add(radius=.42, depth=.05, vertices=96, location=(0, 0, -.025)); plinth = bpy.context.object; plinth.data.materials.append(mat)

bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(OUT + '.blend'))
for o in [body, eyes]:
    bl.subdivide(o, 1)
if STAGE == 'hair':
    hz = V[:, 2].max() - .14; fz = J['head'].z + .05
    bl.light_rig((0, 0, hz), dist=1.2, energy=40)
    bl.camera((.15, -1.15, hz), (0, 0, hz - .02), lens=85); bl.render(OUT + '_a.png', 480, 24)
    bl.camera((-.75, -.85, hz + .05), (0, 0, hz - .02), lens=85); bl.render(OUT + '_b.png', 480, 24)
    bl.camera((-1.1, .35, hz), (0, 0, hz - .03), lens=85); bl.render(OUT + '_c.png', 480, 24)
else:
    hz = V[:, 2].max() / 2
    bl.light_rig((0, 0, hz), dist=2.5, energy=120)
    bl.camera((0, -6, hz), (0, 0, hz), lens=85); bl.render(OUT + '_a.png', 480, 16)
    bl.camera((-3.6, -4.6, hz + .3), (0, 0, hz), lens=85); bl.render(OUT + '_b.png', 480, 16)
    bl.camera((-2.0, -2.6, 1.55), (0, 0, 1.45), lens=85); bl.render(OUT + '_c.png', 480, 20)
