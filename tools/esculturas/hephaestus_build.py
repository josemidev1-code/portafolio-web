"""Construye el Hefesto de mármol: cuerpo posado, exomis simulada, barba rizada, píleo, martillo y yunque."""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
import numpy as np, math, bpy, bmesh, mh, bl, hair, hephaestus_def as A
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

STAGE = os.environ.get('STAGE', 'all')
OUT = os.environ.get('OUT', 'out/hephaestus')
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
    top_z = J['clavicle.L'].z - .14; belt_z = J['spine03'].z - .02; hem_z = J['lowerleg01.L'].z + .03
    NU, NV = 128, 150
    verts, pin_top, pin_belt = [], [], []
    dz = (top_z - hem_z) / (NV - 1)
    prof = []
    for j in range(NV):
        z = top_z - dz * j
        c, rx, ry = section(z - .05, z + .05, True) if z > .25 else section(.2, .3, True)
        prof.append([z, c.x, c.y, rx, ry])
    prof = np.array(prof)
    # Perfil suavizado y holgura creciente hacia el bajo para que caigan pliegues verticales.
    for k in (3, 4):
        prof[:, k] = np.maximum.accumulate(prof[:, k]) * 0 + prof[:, k]
        prof[:, k] = np.convolve(np.pad(prof[:, k], 6, mode='edge'), np.ones(13) / 13, mode='valid')
    for j, (z, cx, cy, rx, ry) in enumerate(prof):
        if z > belt_z: m = .012 + .03 * (top_z - z) / (top_z - belt_z) * (1 - (top_z - z) / (top_z - belt_z)) * 4
        else:
            t = (belt_z - z) / (belt_z - hem_z); m = .012 + .035 * t + .03 * t * t
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
    """Barba y bigote de rizos cortos, rizos en la nuca y píleo cónico de fieltro."""
    rng = np.random.default_rng(11)
    # Vértices de la cabeza y de todos sus huesos faciales (mandíbula, boca, lengua).
    def under_head(n):
        while n:
            if n == 'head': return True
            n = B[n]['parent']
        return False
    best = np.zeros(len(v)); dom = np.empty(len(v), dtype=object)
    for n, lst in W.items():
        for i, w in lst:
            if w > best[i]: best[i] = w; dom[i] = n
    head_idx = np.array([i for i in range(len(v)) if dom[i] and under_head(dom[i])])
    H = hair.Head(v, body_f, head_idx[best[head_idx] > .5])
    P = v[head_idx]; front = P[:, 2] > H.C[2] - .05
    eye_y = (B['eye.L']['head'][1] + B['eye.R']['head'][1]) / 2
    chin_y = P[front, 1].min(); mouth_y = eye_y - (eye_y - chin_y) * .62
    # Volumen de la barba: la piel de la mandíbula se separa y se descuelga, más en el mentón.
    curls = []
    region = []
    for i in head_idx:
        p = v[i]
        if p[2] < H.C[2] - .15 or p[1] > mouth_y + .22: continue
        lips = abs(p[0]) < .27 and abs(p[1] - mouth_y) < .12 and p[2] > H.C[2] + .5
        stache = abs(p[0]) < .34 and mouth_y + .08 < p[1] < mouth_y + .22 and p[2] > H.C[2] + .5
        jaw = p[1] < mouth_y + .03 and p[1] > chin_y - .1
        if (jaw or stache) and not lips: region.append((p, stache))
    for k in rng.choice(len(region), min(len(region), 900), replace=False):
        p, stache = region[k]
        n = p - H.C; n[1] *= .3; n /= np.linalg.norm(n)
        chin_w = max(0, 1 - abs(p[0]) / .75) * max(0, min(1, (mouth_y - p[1]) / .5 + .3))
        if stache:
            d = np.array([np.sign(p[0]) * .8, -.6, .25]); d /= np.linalg.norm(d); L = .3; th = .03
        else:
            d = np.array([0, -1., 0]) + n * .35; d /= np.linalg.norm(d); L = .35 + 1.0 * chin_w + rng.uniform(0, .2); th = .05 + .18 * chin_w
        a0 = rng.uniform(0, 6.28); side = np.cross(d, n); side /= np.linalg.norm(side) + 1e-9; up2 = np.cross(side, d)
        pts = []
        for j in range(12):
            t = j / 11; ang = a0 + t * 6.28 * 1.6
            pts.append(p + n * (th * math.sin(math.pi * min(1, t * 1.6)) + .02) + d * L * t + (side * math.cos(ang) + up2 * math.sin(ang)) * .055 * min(1, t * 4))
        curls.append((np.array(pts), .045 if stache else .062 + .02 * chin_w))
    # Rizos bajo el píleo: nuca y detrás de las orejas.
    for k in range(70):
        a = rng.uniform(math.radians(60), math.radians(300)); pol = rng.uniform(math.radians(78), math.radians(102))
        d = np.array([math.sin(pol) * math.sin(a), math.cos(pol), math.sin(pol) * math.cos(a)])
        if d[2] > .35: continue
        r = H.surface(d)
        if r is None: continue
        p = H.C + d * (r + .02); a0 = rng.uniform(0, 6.28); pts = []
        for i in range(12):
            t = i / 11; ang = a0 + t * 7
            pts.append(p + np.array([0, -.4 * t, 0]) + d * .1 * t + np.array([math.cos(ang), 0, math.sin(ang)]) * .06 * min(1, t * 3))
        curls.append((np.array(pts), .065))
    cu = bpy.data.curves.new('beard', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 1; cu.bevel_resolution = 2; cu.resolution_u = 3
    for Pp, rad in curls:
        Q = to_world(Pp); sp = cu.splines.new('NURBS'); sp.points.add(len(Q) - 1); sp.use_endpoint_u = True; sp.order_u = 4
        for i, q in enumerate(Q):
            t = i / (len(Q) - 1); sp.points[i].co = (*q, 1); sp.points[i].radius = rad * S * (1 - .5 * t)
    ob = bpy.data.objects.new('beard', cu); bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.convert(target='MESH'); ob = bpy.context.object
    rm = ob.modifiers.new('rm', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = .0028
    sm = ob.modifiers.new('sm', 'SMOOTH'); sm.factor = .5; sm.iterations = 2
    bpy.ops.object.modifier_apply(modifier='rm'); bpy.ops.object.modifier_apply(modifier='sm')
    for p in ob.data.polygons: p.use_smooth = True
    ob.data.materials.append(mat)
    # Píleo: cono de fieltro redondeado con borde enrollado, ajustado al cráneo.
    rim_pol = math.radians(66); rr = []
    for k in range(48):
        a = k / 48 * 6.28; d = np.array([math.sin(rim_pol) * math.sin(a), math.cos(rim_pol), math.sin(rim_pol) * math.cos(a)])
        r = H.surface(d); rr.append(r if r else 1.0)
    R = max(rr) * math.sin(rim_pol) + .1; y0 = H.C[1] + np.mean(rr) * math.cos(rim_pol) - .05
    prof = [(R, 0), (R * 1.0, .25), (R * .93, .7), (R * .72, 1.25), (R * .45, 1.75), (R * .18, 2.1), (0, 2.22)]
    V_, F_ = [], []; NA = 64
    for j, (r, y) in enumerate(prof):
        for k in range(NA):
            a = k / NA * 6.28; V_.append(H.C + np.array([math.sin(a) * r, y0 - H.C[1] + y, math.cos(a) * r * 1.06]) + np.array([0, 0, -.05]))
    for j in range(len(prof) - 1):
        for k in range(NA): F_.append((j * NA + k, j * NA + (k + 1) % NA, (j + 1) * NA + (k + 1) % NA, (j + 1) * NA + k))
    cap = bl.mesh_from('cap', to_world(np.array(V_)), F_); cap.data.materials.append(mat); bl.subdivide(cap, 2)
    ring = np.array([V_[k] for k in range(NA)] + [V_[0]])
    cb = bpy.data.curves.new('brim', 'CURVE'); cb.dimensions = '3D'; cb.bevel_depth = .009; cb.bevel_resolution = 3
    sp = cb.splines.new('NURBS'); Qb = to_world(ring); sp.points.add(len(Qb) - 1); sp.use_cyclic_u = True; sp.order_u = 4
    for i, q in enumerate(Qb): sp.points[i].co = (*q, 1)
    bo = bpy.data.objects.new('brim', cb); bpy.context.collection.objects.link(bo); bo.data.materials.append(mat)
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
    keep_bones = {'spine01', 'spine02', 'spine03', 'clavicle.L', 'shoulder01.L', 'upperarm01.L', 'breast.L'}
    neck_z = J['neck01'].z + .005
    sel = np.array([(dom[i] in keep_bones) and V[i, 2] > top_z - .035 and V[i, 2] < neck_z and V[i, 0] > -.04 + (V[i, 2] - top_z) * -.25 for i in range(len(V))])
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
    # Fíbula en el hombro izquierdo, donde se sujeta la exomis.
    sh = J['shoulder01.L']; o = sh + Vector((0, -.25, .06)); p, n = surface_point(yoke, o, Vector((0, 1, -.15)))
    if p: brooch(p + n * .006, n, .024, gold)
    # Martillo en la mano derecha: mango hacia abajo y cabeza junto a la rodilla.
    fist = sum((J[f'finger{k}-2.R'] for k in '2345'), Vector()) / 4
    hl = .42
    bpy.ops.mesh.primitive_cylinder_add(radius=.016, depth=hl, vertices=20, location=(fist.x, fist.y - .01, fist.z - hl / 2 + .05)); bpy.context.object.data.materials.append(gold)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(fist.x, fist.y - .01, fist.z - hl + .06)); hh = bpy.context.object; hh.scale = (.075, .2, .07); hh.data.materials.append(gold)
    # Yunque sobre un tocón, bajo la mano izquierda.
    hand = J['wrist.L'] + (JT['wrist.L'] - J['wrist.L']) * .5
    ax, ay, top = hand.x + .06, hand.y - .02, hand.z - .05
    bpy.ops.mesh.primitive_cylinder_add(radius=.19, depth=.5, vertices=40, location=(ax, ay, .25)); st = bpy.context.object; st.data.materials.append(mat)
    tp = st.modifiers.new('t', 'SIMPLE_DEFORM'); tp.deform_method = 'TAPER'; tp.factor = -.25
    # Yunque de cintura estrecha: base, cuello y tabla con cuerno.
    for (sx, sy, sz, z) in [(.2, .3, .08, .54), (.12, .2, top - .2 - .58, (top - .2 + .58) / 2), (.17, .36, .14, top - .13)]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(ax, ay, z)); c = bpy.context.object; c.scale = (sx, sy, sz); c.data.materials.append(mat)
        bv = c.modifiers.new('b', 'BEVEL'); bv.width = .012; bv.segments = 2
    bpy.ops.mesh.primitive_cone_add(radius1=.065, radius2=.004, depth=.22, vertices=24, location=(ax, ay - .28, top - .1)); hn = bpy.context.object; hn.rotation_euler = (math.pi / 2, 0, 0); hn.data.materials.append(mat)
    # Plinto circular integrado.
    bpy.ops.mesh.primitive_cylinder_add(radius=.48, depth=.05, vertices=96, location=(.04, 0, -.025)); plinth = bpy.context.object; plinth.data.materials.append(mat)

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
