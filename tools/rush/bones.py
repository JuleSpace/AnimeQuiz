import json, struct, sys
import numpy as np
def q2m(q):
    x,y,z,w=q
    return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def local(n):
    if 'matrix' in n: return np.array(n['matrix']).reshape(4,4).T
    M=np.eye(4); R=q2m(n.get('rotation',[0,0,0,1])); S=np.diag(n.get('scale',[1,1,1]))
    M[:3,:3]=R@S; M[:3,3]=n.get('translation',[0,0,0]); return M
f=sys.argv[1]
b=open(f,'rb').read(); n=struct.unpack('<I',b[12:16])[0]; j=json.loads(b[20:20+n])
print('asset', j.get('asset',{}).get('extras'))
nodes=j['nodes']; parent={}
for i,nd in enumerate(nodes):
    for c in nd.get('children',[]): parent[c]=i
W={}
def world(i):
    if i in W: return W[i]
    M=local(nodes[i]); 
    if i in parent: M=world(parent[i])@M
    W[i]=M; return M
joints=set(j['skins'][0]['joints'])
ys=[world(i)[1,3] for i in joints]; lo,hi=min(ys),max(ys)
def show(i,d):
    nd=nodes[i]; p=world(i)[:3,3]
    if i in joints and d<40:
        name=nd.get('name','')
        if not any(k in name for k in ['Eye','Brow','Lip','Teeth','Hair','Jaw','Mouth','Needle','dummy','shadow','Whisker','Nose','Ear','Eyelid']):
            print('  '*d + f"{name[-14:]:<16} x={p[0]:7.2f} y={p[1]:7.2f} z={p[2]:7.2f} h={(p[1]-lo)/(hi-lo):.2f}")
    for c in nd.get('children',[]): show(c,d+1)
for r in j['scenes'][0]['nodes']: show(r,0)
