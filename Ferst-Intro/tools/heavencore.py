"""heavencore: grade pálido (ref. treasury) + pixelado general + cara en bloques (con tracking).

Lee los originales de media-src/ y escribe en public/ con el mismo nombre.
Uso:  pip install opencv-python-headless numpy  &&  python3 tools/heavencore.py
"""
import json, os, subprocess, sys, cv2, numpy as np
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.dirname(HERE)
SRC=os.path.join(ROOT,'media-src')+'/'
OUT=sys.argv[1] if len(sys.argv)>1 else os.path.join(ROOT,'public')+'/'
# cajas de cara detectadas con mediapipe (sólo para los videos en DETECT)
B=json.load(open(os.path.join(HERE,'face-boxes.json')))

# keyframes manuales: frame -> (cx, cy, r) normalizados (r = radio / ancho)
KF={
 'Convert to GIF project - 09 July 2026 at 01.01.42.mp4':
   {0:(.47,.40,.09),10:(.45,.42,.09),20:(.56,.42,.10),30:(.53,.42,.10),40:(.56,.38,.11),50:(.56,.40,.11),60:(.56,.40,.11),71:(.56,.40,.11)},
 'Convert to GIF project - 09 July 2026 at 01.01.42-3.mp4':
   {0:(.44,.17,.16),7:(.47,.19,.16),14:(.59,.21,.16),16:(.48,.47,.15),18:(.41,.54,.16),20:(.31,.62,.17),22:(.28,.62,.17),24:(.19,.67,.17),25:(.25,.40,.17),26:(.34,.17,.16),28:(.44,.17,.16),35:(.50,.23,.16),42:(.45,.56,.16),44:(.41,.60,.17),47:(.28,.60,.17),50:(.22,.58,.17)},
 'Convert to GIF project - 09 July 2026 at 01.01.42-6.mp4':
   {0:(.06,.42,.12),5:(.19,.33,.12),10:(.28,.21,.12),15:(.34,.17,.12),21:(.37,.12,.12),26:(.31,.17,.12),31:(.37,.17,.12),37:(.37,.17,.12)},
 '1.mp4':
   {0:(.36,.46,.12),1:(.34,.44,.12),2:(.33,.46,.12),3:(.33,.44,.12),4:(.33,.44,.12),5:(.33,.42,.12),6:(.30,.40,.12),8:(.30,.42,.12)},
 'champan.mp4':
   {0:(.56,.10,.12),26:(.56,.21,.12),53:(.55,.19,.12),80:(.56,.21,.12),107:(.56,.17,.12),134:(.58,.21,.12),161:(.50,.12,.12),188:(.41,.25,.12)},
 'dancingwiththestars(1).mp4':
   {0:(.58,.35,.09),4:(.55,.31,.09),8:(.56,.29,.09),12:(.53,.35,.09),16:(.58,.29,.09),20:(.56,.35,.09),24:(.56,.29,.09),28:(.56,.27,.09)},
 'nomiresparaabajo.mp4':
   {0:(.56,.54,.08),9:(.56,.54,.08),18:(.56,.56,.08),28:(.56,.54,.08),37:(.56,.54,.08),47:(.52,.56,.08),56:(.52,.60,.08),66:(.50,.60,.08)},
}
DETECT=['pucho(1).mp4']

def interp(kf,n):
    ks=sorted(kf); a=np.array([kf[k] for k in ks],float)
    return np.stack([np.interp(np.arange(n),ks,a[:,j]) for j in range(3)],1)

def from_detect(name,n,W,H):
    bx=B[name]['boxes']; pts={}
    for i,b in enumerate(bx):
        if b: x,y,w,h=b; pts[i]=((x+w/2)/W,(y+h*.45)/H,w*.62/W)
    a=np.array(list(pts.values())); med=np.median(a,0)
    pts={i:p for i,p in pts.items() if abs(p[0]-med[0])<.2 and abs(p[1]-med[1])<.25 and p[2]<med[2]*1.8}
    return interp(pts,n)

def smooth(t,k=3):
    if len(t)<k: return t
    pad=np.pad(t,((k//2,k//2),(0,0)),mode='edge')
    return np.stack([np.convolve(pad[:,j],np.ones(k)/k,'valid') for j in range(t.shape[1])],1)

def gblur(img,s):
    return cv2.GaussianBlur(img,(0,0),max(.1,s))

def grade(img,W,rng):
    img=img*.45+gblur(img,W*.006)*.55           # suavidad general (ablanda los gifs)
    lum=img@np.array([.299,.587,.114],np.float32)
    L=lum[...,None]
    img=L+(img-L)*.55                          # menos saturado
    img=.15+img*.80                            # negros levantados, contraste bajo
    img=np.power(np.clip(img,0,1),.82)         # aire / sobreexpuesto
    sh=np.array([.46,.35,.39],np.float32)      # sombras malva
    hi=np.array([1.0,.955,.905],np.float32)     # altas crema-rosado
    img=img*(1-(1-L)*.30)+sh*(1-L)*.30
    img=img*(hi*L+(1-L))
    g=gblur(img,W*.06)
    img=1-(1-img)*(1-g*.5)                    # bloom
    img+=rng.normal(0,.018,img.shape[:2])[...,None].astype(np.float32)
    return np.clip(img,0,1)

def make_cells(W,H,cs,seed=11):
    """patrón fijo de bloques: desplazamientos y bloques grandes estables en el tiempo"""
    gw,gh=W//cs+2,H//cs+2
    r=np.random.default_rng(seed)
    return gw,gh,r.integers(-1,2,(gh,gw)),r.integers(-1,2,(gh,gw)),r.random((gh//2+2,gw//2+2))<.34

def mosaic(img,cs,cells):
    """pixelado en bloques irregulares (estilo macrobloques de video comprimido)"""
    H,W=img.shape[:2]; gw,gh,ox,oy,big=cells
    pad=cv2.copyMakeBorder(img,0,gh*cs-H,0,gw*cs-W,cv2.BORDER_REPLICATE)
    small=cv2.resize(pad,(gw,gh),interpolation=cv2.INTER_AREA)         # color medio por celda
    yy,xx=np.mgrid[0:gh,0:gw]
    sm=small[np.clip(yy+oy,0,gh-1),np.clip(xx+ox,0,gw-1)]              # bloques corridos
    bs=cv2.resize(small,(gw//2+1,gh//2+1),interpolation=cv2.INTER_AREA) # bloques de 2x2
    bigup=np.repeat(np.repeat(bs,2,0),2,1)[:gh,:gw]
    bm=np.repeat(np.repeat(big,2,0),2,1)[:gh,:gw,None]
    sm=np.where(bm,bigup,sm)
    return cv2.resize(sm,(gw*cs,gh*cs),interpolation=cv2.INTER_NEAREST)[:H,:W]

def face_fx(img,cx,cy,R,t,W,H,cs,cells):
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    dx,dy=xx-cx,yy-cy; d=np.sqrt(dx*dx+dy*dy)+1e-3
    # la cara se cubre con bloques pixelados, pálidos y apenas suavizados
    e=np.sqrt((dx/(R*1.35))**2+(dy/(R*1.7))**2)
    m=np.clip(1.15-e,0,1); m=gblur(m,R*.22)[...,None]; m=np.clip(m*1.6,0,1)
    blocks=gblur(mosaic(img,cs,cells),max(.6,cs*.14))
    blocks=blocks*.82+.18*np.array([1,.975,.955],np.float32)
    img=img*(1-m)+blocks*m
    # halo muy tenue
    light=(np.exp(-(d/(R*2.4))**2)*.20*(.95+.05*np.sin(t*2.2)))[...,None]
    return np.clip(1-(1-img)*(1-light*np.array([1,.975,.955],np.float32)),0,1)

def run(name):
    cap=cv2.VideoCapture(SRC+name); fps=cap.get(cv2.CAP_PROP_FPS); frs=[]
    while True:
        ok,f=cap.read()
        if not ok: break
        frs.append(f)
    n=len(frs); H,W=frs[0].shape[:2]
    tr=from_detect(name,n,W,H) if name in DETECT else interp(KF[name],n)
    tr=smooth(tr); rng=np.random.default_rng(7)
    cs=max(4,int(round(float(np.median(tr[:,2]))*W*.40)))     # tamaño de bloque en la cara
    cells=make_cells(W,H,cs); px=max(2,int(round(W/120)))      # pixelado general
    p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r',str(fps),'-i','-',
        '-c:v','libx264','-preset','slow','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart','-an',OUT+name],stdin=subprocess.PIPE)
    for i,f in enumerate(frs):
        img=cv2.cvtColor(f,cv2.COLOR_BGR2RGB).astype(np.float32)/255
        img=grade(img,W,rng)
        img=cv2.resize(cv2.resize(img,(max(1,W//px),max(1,H//px)),interpolation=cv2.INTER_AREA),(W,H),interpolation=cv2.INTER_NEAREST)
        cx,cy,r=tr[i]; img=face_fx(img,cx*W,cy*H,r*W,i/fps,W,H,cs,cells)
        p.stdin.write(cv2.cvtColor((img*255+.5).astype(np.uint8),cv2.COLOR_RGB2BGR).tobytes())
    p.stdin.close(); p.wait(); print('ok',name,n)

if __name__=='__main__':
    for name in list(KF)+DETECT: run(name)
