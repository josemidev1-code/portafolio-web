"""Definición de Atenea: rasgos según el retrato de referencia (óvalo, nariz griega, labios llenos, ojos almendrados)."""
BODY = {
    'macrodetails/caucasian-female-young': .7, 'macrodetails/african-female-young': .15, 'macrodetails/asian-female-young': .15,
    'macrodetails/universal-female-young-averagemuscle-minweight': .3,
    'macrodetails/proportions/female-young-averagemuscle-averageweight-idealproportions': .9,
    'macrodetails/height/female-young-averagemuscle-averageweight-maxheight': .35,
    'breast/female-young-averagemuscle-averageweight-mincup-averagefirmness': .25,
    'neck/neck-scale-horiz-decr': .25, 'neck/neck-scale-vert-incr': .3,
}
FACE = {
    'head/head-oval': .45, 'head/head-round': .15,
    'chin/chin-prominent-incr': .35, 'chin/chin-width-decr': .1, 'chin/chin-height-incr': .15,
    'nose/nose-greek-incr': .8, 'nose/nose-hump-decr': .6, 'nose/nose-point-width-decr': .4, 'nose/nose-width1-decr': .3,
    'nose/nose-scale-horiz-decr': .25, 'nose/nose-volume-decr': .2, 'nose/nose-trans-forward': .2,
    'mouth/mouth-upperlip-volume-incr': .8, 'mouth/mouth-lowerlip-volume-incr': .9, 'mouth/mouth-cupidsbow-incr': .7,
    'mouth/mouth-scale-horiz-decr': .1, 'mouth/mouth-lowerlip-height-incr': .3, 'mouth/mouth-upperlip-height-incr': .2,
    'cheek/l-cheek-bones-incr': .4, 'cheek/r-cheek-bones-incr': .4, 'cheek/l-cheek-volume-incr': .15, 'cheek/r-cheek-volume-incr': .15,
    'eyes/l-eye-scale-incr': 1.0, 'eyes/r-eye-scale-incr': 1.0, 'eyes/l-eye-height1-incr': .4, 'eyes/r-eye-height1-incr': .4, 'eyes/l-eye-corner2-up': .3, 'eyes/r-eye-corner2-up': .3,
    'eyes/l-eye-height2-incr': .25, 'eyes/r-eye-height2-incr': .25,
    'eyebrows/eyebrows-trans-forward': .7, 'eyebrows/eyebrows-angle-up': .25, 'forehead/forehead-nubian-incr': .1,
    'head/head-scale-vert-decr': .35, 'head/head-age-decr': .5, 'mouth/mouth-angles-up': .15, 'eyes/l-eye-push1-out': .2, 'eyes/r-eye-push1-out': .2,
}


def pose(mh, B):
    """Contrapposto: peso en la pierna derecha, lanza en la mano izquierda, cabeza inclinada con serenidad."""
    import numpy as np
    aims = {
        'upperarm01.L': (.34, -.93, .1), 'lowerarm01.L': (.12, .05, 1.0),        # brazo de la lanza, antebrazo hacia delante
        'upperarm01.R': (-.3, -.95, .06), 'lowerarm01.R': (-.16, -.93, .3),     # brazo relajado
        'upperleg01.L': (.1, -.97, .22), 'lowerleg01.L': (.05, -.96, -.28),       # rodilla izquierda flexionada
        'upperleg01.R': (-.03, -1, .02), 'lowerleg01.R': (0, -1, .0),
    }
    knuckle = B['finger2-1.L']['head'] - B['finger5-1.L']['head']
    curl = {}
    for f in '2345':
        for j, a in zip('123', (75, 85, 60)): curl[f'finger{f}-{j}.L'] = mh.rot(knuckle, -a)
    curl['finger1-2.L'] = mh.rot((0, 0, 1), -35); curl['finger1-3.L'] = mh.rot((0, 0, 1), -35)
    kR = B['finger2-1.R']['head'] - B['finger5-1.R']['head']
    for f in '2345':
        for j, a in zip('123', (20, 25, 15)): curl[f'finger{f}-{j}.R'] = mh.rot(kR, a)
    curl.update({'head': mh.rot((0, 1, 0), -12) @ mh.rot((1, 0, 0), 9), 'neck02': mh.rot((0, 0, 1), 4),
                 'spine03': mh.rot((0, 0, 1), -2.5), 'spine01': mh.rot((0, 0, 1), 3),
                 'wrist.L': mh.rot((0, 0, 1), -25)})
    return mh.aim_pose(B, aims, curl)
