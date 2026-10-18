"""Exporta dos LOD con presupuesto por pieza, conservando detalle facial."""
import bpy, os, json
root=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
src=os.path.join(root,'outputs/atenea-reconstruida.blend')
reports=[]
for mobile in (False,True):
    bpy.ops.wm.open_mainfile(filepath=src)
    body=bpy.data.objects['body']; height=max(v.co.z for v in body.data.vertices)
    for o in list(bpy.data.objects):
        if o.type not in ('MESH','CURVE'): bpy.data.objects.remove(o,do_unlink=True)
    def select(o):
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active=o
    for o in list(bpy.data.objects):
        select(o)
        if o.type=='CURVE': bpy.ops.object.convert(target='MESH'); o=bpy.context.object
        if o.name in ('body','eyes'):
            m=o.modifiers.new('Surface','SUBSURF'); m.levels=1
        for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
        budget=1800
        if o.name=='body': budget=22000 if mobile else 60000
        elif o.name=='eyes': budget=3000 if mobile else 8000
        elif o.name=='hair': budget=18000 if mobile else 50000
        elif o.name=='chiton': budget=12000 if mobile else 30000
        elif o.name=='yoke': budget=6000 if mobile else 16000
        elif o.name=='wreath': budget=5000 if mobile else 9000
        tri=sum(len(p.vertices)-2 for p in o.data.polygons)
        if tri>budget:
            m=o.modifiers.new('Web LOD','DECIMATE'); m.ratio=budget/tri
            m.use_collapse_triangulate=True; bpy.ops.object.modifier_apply(modifier=m.name)
        o.data.validate(verbose=False,clean_customdata=False); o.data.update()
        o.scale/=height; o.location/=height
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    groups={}
    for o in list(bpy.context.scene.objects):
        if o.type=='MESH': groups.setdefault(o.active_material.name if o.active_material else 'marble',[]).append(o)
    for name,objs in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs: o.select_set(True)
        bpy.context.view_layer.objects.active=objs[0]; bpy.ops.object.join(); bpy.context.object.name=name
    dst=os.path.join(root,'outputs/atenea-movil.glb' if mobile else 'outputs/atenea.glb')
    bpy.ops.export_scene.gltf(filepath=dst,export_format='GLB',export_yup=True,
        export_texcoords=False,export_normals=True,export_materials='EXPORT',
        export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=7,
        export_draco_position_quantization=16,export_draco_normal_quantization=12)
    reports.append(dict(file=os.path.basename(dst),bytes=os.path.getsize(dst),
        triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')))
with open(os.path.join(root,'outputs/atenea-export.json'),'w') as f: json.dump(reports,f,indent=2)
print(json.dumps(reports))
