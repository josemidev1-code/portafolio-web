import bpy, os, json
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
bpy.ops.import_scene.gltf(filepath=os.path.join(root, 'assets/atenea/atenea.glb'))
for o in bpy.context.scene.objects:
    if o.type == 'MESH':
        pts = [o.matrix_world @ Vector(v) for v in o.bound_box]
        print('MESH', o.name, len(o.data.vertices), 'bounds', [list(map(float,p)) for p in pts])
        for m in o.data.materials:
            if m and m.use_nodes:
                p=m.node_tree.nodes.get('Principled BSDF')
                if p: p.inputs['Base Color'].default_value=(.65,.61,.54,1)
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=16
sc.render.resolution_x=900; sc.render.resolution_y=1000; sc.render.resolution_percentage=100
w=bpy.data.worlds.new('Studio'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=(.12,.12,.12,1)
def aim(obj,pt): obj.rotation_euler=(Vector(pt)-obj.location).to_track_quat('-Z','Y').to_euler()
for pos,power,size in [((1,-2,3),180,2),((-2,-1,2),80,2),((0,2,3),200,1)]:
    d=bpy.data.lights.new('Studio','AREA'); d.energy=power; d.shape='DISK'; d.size=size
    o=bpy.data.objects.new('Studio',d); sc.collection.objects.link(o); o.location=pos; aim(o,(0,0,.7))
d=bpy.data.cameras.new('Portrait'); o=bpy.data.objects.new('Portrait',d); sc.collection.objects.link(o)
o.location=(0,-2.6,.91); aim(o,(0,0,.91)); d.type='ORTHO'; d.ortho_scale=.26; sc.camera=o
os.makedirs(os.path.join(root,'outputs'),exist_ok=True)
sc.render.filepath=os.path.join(root,'outputs/atenea-cara-antes.png'); bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'outputs/atenea-estudio.blend'))

