"""Hefesto: herrero maduro y musculoso, barba rizada, píleo y exomis. Martillo en la derecha, la izquierda sobre el yunque."""
BODY = {
    'macrodetails/caucasian-male-young': .5, 'macrodetails/caucasian-male-old': .3, 'macrodetails/african-male-young': .1, 'macrodetails/asian-male-young': .1,
    'macrodetails/universal-male-young-maxmuscle-averageweight': .7, 'macrodetails/universal-male-young-maxmuscle-maxweight': .3, 'macrodetails/universal-male-old-maxmuscle-averageweight': .25,
    'macrodetails/proportions/male-young-maxmuscle-averageweight-idealproportions': .7,
    'macrodetails/height/male-young-maxmuscle-averageweight-maxheight': .15,
    'neck/neck-scale-horiz-incr': .5, 'torso/torso-scale-horiz-incr': .3, 'torso/torso-vshape-incr': .5,
}
FACE = {
    'nose/nose-greek-incr': .5, 'nose/nose-scale-horiz-incr': .15, 'nose/nose-hump-decr': .3,
    'chin/chin-width-incr': .3, 'eyebrows/eyebrows-trans-forward': .7, 'forehead/forehead-nubian-incr': .3,
    'head/head-square': .3, 'eyes/l-eye-scale-incr': .3, 'eyes/r-eye-scale-incr': .3,
    'mouth/mouth-lowerlip-volume-incr': .3,
}


def pose(mh, B):
    aims = {
        'upperarm01.R': (-.16, -.97, .12), 'lowerarm01.R': (-.06, -.9, .42),      # martillo colgando delante del muslo
        'upperarm01.L': (.22, -.96, .1), 'lowerarm01.L': (.25, -.45, .86),        # mano izquierda sobre el yunque
        'upperleg01.R': (-.12, -.97, .2), 'lowerleg01.R': (-.06, -.96, -.26),     # rodilla derecha algo flexionada
        'upperleg01.L': (.05, -1, .02), 'lowerleg01.L': (.02, -1, 0),
    }
    kR = B['finger2-1.R']['head'] - B['finger5-1.R']['head']
    curl = {}
    for f in '2345':
        for j, a in zip('123', (80, 85, 60)): curl[f'finger{f}-{j}.R'] = mh.rot(kR, a)
    curl['finger1-2.R'] = mh.rot((0, 0, 1), 35); curl['finger1-3.R'] = mh.rot((0, 0, 1), 35)
    curl.update({'head': mh.rot((0, 1, 0), 14) @ mh.rot((1, 0, 0), 10), 'spine01': mh.rot((0, 0, 1), -3), 'wrist.L': mh.rot((1, 0, 0), 25)})
    return mh.aim_pose(B, aims, curl)
