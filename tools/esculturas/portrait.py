"""Render reproducible de una escultura guardada. No altera el archivo fuente."""
import bpy, os, sys
sys.path.insert(0,os.path.dirname(__file__))
import bl
root=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
bpy.ops.wm.open_mainfile(filepath=os.path.join(root,'outputs/atenea-reconstruida.blend'))
for o in list(bpy.data.objects):
    if o.type in ('LIGHT','CAMERA'): bpy.data.objects.remove(o,do_unlink=True)
bl.light_rig((0,0,1.72),dist=1.2,energy=22)
bl.camera((0,-1.5,1.76),(0,0,1.70),lens=85)
bl.render(os.path.join(root,'outputs/atenea-cara-nueva.png'),900,32)
bl.camera((-.9,-1.3,1.78),(0,0,1.70),lens=85)
bl.render(os.path.join(root,'outputs/atenea-tres-cuartos.png'),900,32)
bl.camera((0,-6,1.08),(0,0,1.12),lens=70)
bl.render(os.path.join(root,'outputs/atenea-completa.png'),900,24)
