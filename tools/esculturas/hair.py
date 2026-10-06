"""Cabello esculpido con raya al medio y ondas, y corona de hojas, en coordenadas de reposo de MakeHuman (y arriba, z delante)."""
import numpy as np, math
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def rotate(v, axis, ang):
    axis = axis / np.linalg.norm(axis)
    return v * math.cos(ang) + np.cross(axis, v) * math.sin(ang) + axis * np.dot(axis, v) * (1 - math.cos(ang))


class Head:
    def __init__(self, v, faces, head_idx):
        self.bvh = BVHTree.FromPolygons([tuple(p) for p in v], faces)
        P = v[head_idx]
        lo, hi = P.min(0), P.max(0)
        self.C = np.array([(lo[0] + hi[0]) / 2, hi[1] - (hi[1] - lo[1]) * .38, (lo[2] + hi[2]) / 2 - .05])
        self.top = hi[1]

    def surface(self, d):
        """Distancia del centro del cráneo a la piel en la dirección d."""
        hit = self.bvh.ray_cast(Vector(self.C + d * 3), Vector(-d))
        if hit[0] is None: return None
        return float(np.dot(np.array(hit[0]) - self.C, d))


def lock_paths(H, rng, shoulder_y, n=34, alpha0=-50, alpha1=112):
    """Mechones: nacen en la raya, recorren el cráneo siguiendo un flujo (a un lado, abajo y atrás)
    enmarcando el rostro, y caen ondulados hasta los hombros."""
    paths = []
    X, Y, Z = np.eye(3)
    for side in (-1, 1):
        for layer in range(3):
            for k in range(n):
                u = (k + rng.uniform(.15, .85)) / n
                alpha = math.radians(alpha0 + u * (alpha1 - alpha0))
                d = np.array([side * .02, math.cos(alpha), -math.sin(alpha)]); d /= np.linalg.norm(d)
                thick = .05 + .075 * layer + .04 * (1 - u)
                phase = rng.uniform(0, 6.28); amp = .045 + .025 * layer; lam = rng.uniform(.8, 1.1)
                pts = []; travelled = 0; last_d = d
                for i in range(60):
                    r = H.surface(d)
                    if r is None: break
                    side_w = max(0., 1 - abs(d[0]) * 1.15)
                    F = X * side * (.9 * side_w + .05) - Y * (.45 + .9 * abs(d[0])) - Z * (.25 + .25 * u)
                    Ft = F - np.dot(F, d) * d; Ft /= np.linalg.norm(Ft) + 1e-9
                    # Ondas: oscilación perpendicular al flujo sobre el cráneo.
                    perp = np.cross(d, Ft)
                    wave = amp * math.sin(travelled / lam * 6.28 * 1.2 + phase) * min(1, travelled * 2.5)
                    pts.append(H.C + d * (r + thick) + perp * wave)
                    step = .07 / max(r, .5); d = d + Ft * step; d /= np.linalg.norm(d); travelled += .07
                    last_d = d
                    if d[1] < -.32: break
                if len(pts) < 6: continue
                last = pts[-1]
                # Caída libre ondulada, por detrás de los hombros.
                length = (last[1] - shoulder_y) + rng.uniform(-.1, .6) + (.35 if layer == 0 else .1)
                if length > .2:
                    nfall = int(length / .1) + 2; dirz = -.3 if u > .25 else .05
                    for i in range(1, nfall + 1):
                        t = i / nfall
                        w = (amp + .08) * math.sin((travelled + length * t) / lam * 6.28 * 1.2 + phase)
                        pts.append(np.array([last[0] + side * (.12 * t + .45 * w), last[1] - length * t, last[2] + dirz * t + .5 * w]))
                rad = .066 + .022 * layer + rng.uniform(-.012, .016)
                paths.append((np.array(pts), rad))
    # Mechones de la nuca: caen por detrás para cubrir el centro.
    for k in range(12):
        alpha = math.radians(118 + k * 3.5)
        d = np.array([rng.uniform(-.28, .28), math.cos(alpha), -math.sin(alpha)]); d /= np.linalg.norm(d)
        r = H.surface(d)
        if r is None: continue
        p0 = H.C + d * (r + .1); pts = [p0]
        for i in range(1, 16):
            t = i / 15; pts.append(p0 + np.array([.07 * math.sin(t * 8 + k), -(p0[1] - shoulder_y + .5) * t, -.2 * t]))
        paths.append((np.array(pts), .1))
    return paths


def wreath_ring(H, rng, n=40):
    """Anillo de la corona: sobre la frente delante, a la altura de las sienes en los lados y algo más alto detrás."""
    ring = []
    for i in range(n):
        phi = 2 * math.pi * i / n                       # 0 = delante
        sideness = abs(math.sin(phi)); back = max(0., -math.cos(phi))
        theta = math.radians(62 + 8 * sideness - 10 * back)
        d = np.array([math.sin(theta) * math.sin(phi), math.cos(theta), math.sin(theta) * math.cos(phi)])
        r = H.surface(d)
        if r is None: continue
        ring.append((H.C + d * (r + .13 + .13 * sideness + .05 * back), d, phi))
    return ring


def leaf_mesh(length=.55, width=.15, seg=9):
    """Hoja de olivo/laurel: base redondeada, punta aguda, nervio hundido y la punta curvada hacia fuera."""
    V, F = [], []
    for i in range(seg + 1):
        t = i / seg; w = width * (math.sin(math.pi * min(1, t * 1.05)) ** .7) * (1 - .25 * t)
        for s in (-1, -.5, 0, .5, 1):
            V.append((s * w, t * length, -.03 * (1 - abs(s)) * math.sin(math.pi * t) - .02 * abs(s) * (1 - t) + .22 * length * t * t))
    for i in range(seg):
        for j in range(4):
            a = i * 5 + j; F.append((a, a + 1, a + 6, a + 5))
    return np.array(V), F
