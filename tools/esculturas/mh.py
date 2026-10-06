"""Generador de figuras a partir de la malla base CC0 de MakeHuman: objetivos (targets) y pose por LBS."""
import json, os, numpy as np

DATA = os.environ['MH_DATA']  # carpeta makehuman/data del repositorio de MakeHuman


def load_base():
    v, vt, faces, ftex, groups = [], [], [], [], []
    group = None
    for line in open(f'{DATA}/3dobjs/base.obj'):
        if line.startswith('v '): v.append([float(x) for x in line.split()[1:4]])
        elif line.startswith('vt '): vt.append([float(x) for x in line.split()[1:3]])
        elif line.startswith('g '): group = line.split()[1]
        elif line.startswith('f '):
            idx = [p.split('/') for p in line.split()[1:]]
            faces.append([int(p[0]) - 1 for p in idx]); ftex.append([int(p[1]) - 1 if len(p) > 1 and p[1] else -1 for p in idx]); groups.append(group)
    return np.array(v, np.float64), np.array(vt, np.float64), faces, ftex, groups


_cache = {}
def target(name):
    if name not in _cache:
        idx, d = [], []
        for line in open(f'{DATA}/targets/{name}.target'):
            if line.startswith('#') or not line.strip(): continue
            p = line.split(); idx.append(int(p[0])); d.append([float(x) for x in p[1:4]])
        _cache[name] = (np.array(idx, dtype=int), np.array(d, dtype=float).reshape(-1, 3))
    return _cache[name]


def apply(v, mods):
    v = v.copy()
    for name, w in mods.items():
        if not w: continue
        i, d = target(name); v[i] += d * w
    return v


def joint_positions(v):
    skel = json.load(open(f'{DATA}/rigs/default.mhskel'))
    J = {k: v[np.array(ix)].mean(0) for k, ix in skel['joints'].items()}
    bones = {}
    for name, b in skel['bones'].items():
        bones[name] = dict(head=J[b['head']], tail=J[b['tail']], parent=b['parent'])
    return bones


def weights():
    return json.load(open(f'{DATA}/rigs/default_weights.mhw'))['weights']


def rot(axis, deg):
    a = np.radians(deg); axis = np.asarray(axis, float); axis /= np.linalg.norm(axis)
    x, y, z = axis; c, s, C = np.cos(a), np.sin(a), 1 - np.cos(a)
    return np.array([[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]])


def pose(v, bones, W, rotations):
    """rotations: {hueso: matriz 3x3 en ejes del mundo en reposo}. Skinning lineal con jerarquía."""
    order, seen = [], set()
    def visit(n):
        if n in seen or n is None: return
        visit(bones[n]['parent']); seen.add(n); order.append(n)
    for n in bones: visit(n)
    M = {}
    for n in order:
        h = bones[n]['head']; R = rotations.get(n, np.eye(3))
        T = np.eye(4); T[:3, :3] = R; T[:3, 3] = h - R @ h
        p = bones[n]['parent']; M[n] = (M[p] @ T) if p else T
    out = np.zeros_like(v); tot = np.zeros(len(v))
    vh = np.c_[v, np.ones(len(v))]
    for n, lst in W.items():
        if n not in M or not lst: continue
        a = np.array(lst); ix = a[:, 0].astype(int); w = a[:, 1]
        out[ix] += (vh[ix] @ M[n].T)[:, :3] * w[:, None]; tot[ix] += w
    miss = tot < 1e-6; out[miss] = v[miss]; out[~miss] /= tot[~miss, None]
    newbones = {n: dict(head=(M[n] @ np.r_[b['head'], 1])[:3], tail=(M[n] @ np.r_[b['tail'], 1])[:3], parent=b['parent']) for n, b in bones.items()}
    return out, newbones, M


def proxy(path, v):
    """Ajusta un proxy .mhclo (ojos, etc.) a la malla deformada v."""
    d = os.path.dirname(path); refs = []; scale = {}; objf = None; inverts = False
    for line in open(path):
        p = line.split()
        if not p or p[0].startswith('#'): continue
        if p[0] in ('x_scale', 'y_scale', 'z_scale'):
            i, j, f = int(p[1]), int(p[2]), float(p[3]); ax = 'xyz'.index(p[0][0])
            scale[ax] = abs(v[i][ax] - v[j][ax]) / f
        elif p[0] == 'obj_file': objf = p[1]
        elif p[0] == 'verts': inverts = True
        elif inverts and len(p) == 9:
            refs.append(([int(x) for x in p[:3]], [float(x) for x in p[3:6]], [float(x) for x in p[6:9]]))
        elif inverts and len(p) == 1: refs.append(([int(p[0])] * 3, [1, 0, 0], [0, 0, 0]))
    pv = np.array([sum(w * v[i] for i, w in zip(ix, ws)) + np.array(off) * [scale.get(0, 1), scale.get(1, 1), scale.get(2, 1)] for ix, ws, off in refs])
    faces = []
    for line in open(f'{d}/{objf}'):
        if line.startswith('f '): faces.append([int(x.split('/')[0]) - 1 for x in line.split()[1:]])
    return pv, faces


def align(a, b):
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b); c = np.cross(a, b); s = np.linalg.norm(c); d = np.dot(a, b)
    if s < 1e-9: return np.eye(3)
    return rot(c, np.degrees(np.arctan2(s, d)))


def aim_pose(bones, aims, extra=None):
    """aims: {hueso: dirección final en el mundo}; extra: {hueso: rotación local adicional (aplicada tras apuntar)}.
    Devuelve rotaciones locales en ejes del reposo para pose()."""
    extra = extra or {}
    order, seen = [], set()
    def visit(n):
        if n in seen or n is None: return
        visit(bones[n]['parent']); seen.add(n); order.append(n)
    for n in bones: visit(n)
    G, R = {}, {}
    for n in order:
        p = bones[n]['parent']; Rp = G[p] if p else np.eye(3)
        L = np.eye(3)
        if n in aims:
            d0 = bones[n]['tail'] - bones[n]['head']
            L = align(d0, Rp.T @ np.asarray(aims[n], float))
        if n in extra: L = extra[n] @ L
        R[n] = L; G[n] = Rp @ L
    return R
