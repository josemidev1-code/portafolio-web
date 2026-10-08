import sys, time, os; sys.path.insert(0, 'hy')
import torch
from PIL import Image
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
torch.set_num_threads(4)
steps = int(os.environ.get('STEPS', '10')); res = int(os.environ.get('RES', '320'))
imgs = {k: Image.open(f'in/mv_{k}.png').convert('RGBA') for k in ['front', 'left', 'back']}
t = time.time()
p = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained('tencent/Hunyuan3D-2mv', subfolder='hunyuan3d-dit-v2-mv-turbo', variant='fp16', device='cpu', dtype=torch.float32)
p.enable_flashvdm()
p.to('cpu', torch.float32)
print('cargado', time.time() - t, flush=True)
os.makedirs('out/hy', exist_ok=True)
if os.path.exists('out/hy/lat.pt'):
    lat = torch.load('out/hy/lat.pt'); import gc; p.model = None; p.conditioner = None; gc.collect()
else:
    lat = p(image=imgs, num_inference_steps=steps, octree_resolution=res, num_chunks=60000, generator=torch.manual_seed(7), output_type='latent')
    torch.save(lat, 'out/hy/lat.pt')
print('latentes', time.time() - t, flush=True)
with torch.no_grad(): m = p._export(lat, 'trimesh', 1.01, 0.0, int(os.environ.get('CHUNKS','8000')), res, 'mc')[0]
print('hecho', time.time() - t, len(m.faces), flush=True)
os.makedirs('out/hy', exist_ok=True); m.export('out/hy/mesh.obj')
