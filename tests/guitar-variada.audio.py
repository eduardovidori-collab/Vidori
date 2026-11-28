"""Check the rendered MP3: real extension, continuous audio, warm balance and no pasted loop.
Requires numpy and ffmpeg; runs locally without the source recordings.
"""
from pathlib import Path
import subprocess
import numpy as np
root=Path(__file__).resolve().parents[1]
SR=32000

def decode(file):
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-ar',str(SR),'-ac','2','-f','f32le','-'])
 return np.frombuffer(raw,dtype='<f4').reshape(-1,2)

a=decode(root/'audio/cafe/guitarra-variada.mp3')
assert abs(len(a)/SR-209*240/91.2)<.05
assert np.isfinite(a).all() and np.max(np.abs(a))<.7
level=float(np.sqrt(np.mean(a*a)))
assert .025<level<.065,level
# The previous version lasts 337 seconds. A true extension has music throughout,
# without a silent hold, a long fade or an early restart of that same whole track.
window=SR//4
rms=np.sqrt(np.mean(a[:len(a)//window*window].reshape(-1,window,2)**2,axis=(1,2)))
quiet=rms<10**(-55/20)
run=longest=0
for silent in quiet:
 run=run+1 if silent else 0;longest=max(longest,run)
assert longest*.25<1.5,('silent stretch',longest*.25)
for minutes in [1,3,5,7,9]:
 excerpt=a[minutes*60*SR:(minutes*60+8)*SR]
 assert np.sqrt(np.mean(excerpt*excerpt))>.01,minutes
mono=a.mean(axis=1)
frames=mono[:len(mono)//8192*8192].reshape(-1,8192)
power=abs(np.fft.rfft(frames*np.hanning(8192),axis=1))**2
freq=np.fft.rfftfreq(8192,1/SR)
assert power[:,freq>4000].sum()/power.sum()<.001
assert power[:,freq>2000].sum()/power.sum()<.025
# Compare 20-second waveforms at common copy/paste offsets.
x=mono[::32].astype(float)
for lag in [30,60,120,320/.95]:
 shift=round(lag*SR/32);correlations=[]
 for start in range(0,len(x)-shift-20000,5000):
  u=x[start:start+20000];v=x[start+shift:start+shift+20000]
  correlations.append(abs(np.corrcoef(u,v)[0,1]))
 assert max(correlations)<.85,(lag,max(correlations))
assert np.max(abs(np.diff(a,axis=0)))<.2
print('PASS 9min10 music throughout; no 1.5-second silence; no clipping; gentle high frequencies; no copied 30/60/120/337-second loop')
