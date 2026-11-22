"""Prepare a 5m37s cafe guitar arrangement from the approved ambient recording.

Usage: python tools/render-cafe-guitar.py /path/to/source-folder
Requires numpy and ffmpeg with Rubber Band. The folder contains the HQ MP3
previews 689160 (main), 689161 (air 1), 689162 (air 2), 689159 (delay), all CC0:
https://freesound.org/people/deadrobotmusic/sounds/689160/
Sibling IDs have the same author and license. See audio/cafe/CREDITOS.md.
This offline renderer is never loaded by the app.
"""
import argparse
from pathlib import Path
import subprocess
import numpy as np

SR = 32000
TEMPO = .95
SOURCES = [689160, 689161, 689162, 689159]
# Source phrase offset, active duration, and foreground/backing balance.
# Keep the original lead in the opening; develop the two recorded counterlines
# in the middle, then return to the lead with a different accompaniment.
# The harmony remains in A# minor and the original plucking is preserved.
APPROVED_OPENING = [
    (0, 10, [1,.10,.08,.03]),
    (10,10, [.95,.16,.10,.05]),
    (20,10, [.90,.20,.14,.08]),
    (30,10, [.85,.23,.18,.10]),
    (20,10, [.35,.78,.18,.08]),
    (0, 10, [.24,.85,.25,.10]),
    (30,10, [.30,.74,.35,.12]),
    (10,10, [.38,.65,.42,.08]),
    (0, 10, [.30,.20,.82,.10]),
    (20,10, [.35,.28,.78,.14]),
    (10,10, [.46,.24,.68,.12]),
    (30,10, [.75,.18,.42,.16]),
    (10,10, [.88,.25,.30,.10]),
    (20,10, [.94,.20,.24,.08]),
]

# New continuation, built from complete recorded bars, not another copy of the
# old track. Each column is a different recorded guitar. The first two bars of
# each four-bar phrase share one harmony; the last two share its response.
# Choosing donor bars within those groups preserves the original chord changes.
DEVELOPMENTS = [
    ('Ponte', [
        [4,5,10,11,0,1,14,15],
        [8,9,2,3,12,13,6,7],
        [12,13,14,15,4,5,10,11],
        [0,1,6,7,8,9,2,3],
    ], [.65,.35,.42,.08], [.35,.45,.72,.10]),
    ('Pergunta e resposta', [
        [0,5,2,7,8,13,10,15,4,1,14,3,12,9,6,11],
        [12,9,6,3,4,1,14,11,8,5,2,15,0,13,10,7],
        [4,1,14,11,12,5,2,7,0,13,6,15,8,9,10,3],
        [8,9,2,3,0,1,10,11,4,5,14,15,12,13,6,7],
    ], [.92,.22,.22,.08], [.26,.40,.90,.10]),
    ('Respiro', [
        [8,1,6,15,0,9,14,7,12,5,2,11,4,13,10,3],
        [0,13,10,7,8,5,2,15,4,9,14,3,12,1,6,11],
        [12,5,6,3,4,9,10,15,0,1,14,7,8,13,2,11],
        [4,5,14,15,12,13,6,7,8,9,2,3,0,1,10,11],
    ], [.22,.82,.26,.06], [.16,.64,.52,.08]),
    ('Dueto', [
        [12,1,10,3,4,9,6,15,0,13,14,7,8,5,2,11],
        [4,9,14,7,12,1,2,11,8,13,6,15,0,5,10,3],
        [8,13,2,11,0,5,14,3,12,9,10,7,4,1,6,15],
        [0,9,6,15,8,1,14,3,4,13,10,7,12,5,2,11],
    ], [.72,.58,.25,.09], [.52,.42,.65,.10]),
    ('Retorno', [
        [4,5,2,3,12,13,10,11,0,1,14,15,8,9,6,7],
        [12,1,6,11,4,13,2,7,8,5,10,3,0,9,14,15],
        [0,9,14,7,8,1,6,3,4,13,2,11,12,5,10,15],
        [8,9,6,7,0,1,14,15,12,13,2,3,4,5,10,11],
    ], [.98,.20,.16,.06], [.78,.30,.27,.08]),
]

def arrangement_blocks():
    blocks=list(APPROVED_OPENING)
    for name,lines,lead,response in DEVELOPMENTS:
        count=len(lines[0])
        assert len(lines)==4 and all(len(line)==count for line in lines)
        for bar in range(count):
            # Original key and harmony, including when rearranging donor takes.
            assert all((line[bar]%4<2)==(bar%4<2) for line in lines)
            if name=='Ponte':
                blend=bar/(count-1)
            elif name=='Retorno':
                blend=(1-bar/(count-1))*.6
            else:
                blend=1 if bar%4>=2 else 0
            gains=[a*(1-blend)+b*blend for a,b in zip(lead,response)]
            blocks.append(([line[bar]*2.5 for line in lines],2.5,gains))
    return blocks

BLOCKS=arrangement_blocks()
SOURCE_SECONDS=sum(duration for _,duration,_ in BLOCKS)
OUTPUT_SAMPLES=round(SOURCE_SECONDS/TEMPO*SR)

def ff(args, data=None):
    return subprocess.run(['ffmpeg','-v','error','-y',*args],input=data,
                          capture_output=True,check=True).stdout

def rms(x):
    return float(np.sqrt(np.mean(x*x)))

def arrange(folder):
    stems = []
    for identifier in SOURCES:
        raw=ff(['-i',str(folder/f'{identifier}.mp3'),'-ar',str(SR),'-ac','2',
                '-f','f32le','-'])
        recorded=np.frombuffer(raw,dtype='<f4').reshape(-1,2).copy()
        # The files contain 40 seconds of playing plus 7.5 seconds of decay.
        # Fold the decay into the beginning; never insert the silent tail as
        # another musical bar, as the first version of the track did.
        active=recorded[:40*SR].copy()
        tail=recorded[40*SR:]
        active[:len(tail)]+=tail
        active/=max(rms(active),1e-8)
        stems.append(active)
    # 320 active seconds become about 337 seconds at the approved 91.2 BPM.
    # The added length comes from the continuation, not a further slowdown.
    total=round(sum(duration for _,duration,_ in BLOCKS)*SR)
    audio=np.zeros((total,2),dtype=np.float64)
    cursor=0
    overlap=round(.625*SR)  # One beat of compatible harmony, no fade to silence.
    for offset,duration,gains in BLOCKS:
        size=round(duration*SR)
        before=min(overlap,cursor)
        offsets=offset if isinstance(offset,(list,tuple)) else [offset]*4
        block=sum(stem[(round(origin*SR)+np.arange(-before,size))%(40*SR)]*gain
                  for stem,origin,gain in zip(stems,offsets,gains))
        block/=rms(block[before:])
        if before:
            fade=np.linspace(0,1,before)[:,None]
            audio[cursor-before:cursor]*=1-fade
            audio[cursor-before:cursor]+=block[:before]*fade
        audio[cursor:cursor+size]=block[before:]
        cursor+=size
    assert total==320*SR
    return audio.astype('<f4')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sources',type=Path)
    parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'audio/cafe/guitarra.mp3')
    args=parser.parse_args()
    # Keep the input comfortably below full scale throughout the effects chain.
    raw=arrange(args.sources)*.04
    # Warm up the time stretcher on preceding music. Starting it directly on a
    # sustaining reverb tail can create an initialization impulse. Keep playing
    # after the end as well, so its analysis window never runs into silence.
    padding=4*SR
    raw=np.concatenate([raw[-padding:],raw,raw[:padding]])
    warmup=round(padding/TEMPO)
    filters=(f'rubberband=tempo={TEMPO}:pitch=1:transients=mixed:detector=soft:'
             'phase=laminar:window=long:smoothing=on:channels=together,'
             'highpass=f=85,highshelf=f=1200:g=-6,lowpass=f=4200,'
             f'atrim=start_sample={warmup}:end_sample={warmup+OUTPUT_SAMPLES}')
    processed=ff(['-f','f32le','-ar',str(SR),'-ac','2','-i','-',
                  '-af',filters,'-ar',str(SR),'-ac','2','-f','f32le','-'],raw.tobytes())
    audio=np.frombuffer(processed,dtype='<f4').reshape(-1,2).copy()
    assert len(audio)==OUTPUT_SAMPLES
    # Constant gain keeps the same discreet average volume as the original.
    audio*=min(10**(-25.6/20)/rms(audio),10**(-7.8/20)/abs(audio).max())
    n=round(.025*SR)
    seam=(audio[-1]+audio[0])/2
    fade=np.linspace(0,1,n)[:,None]
    audio[:n]=seam*(1-fade)+audio[:n]*fade
    audio[-n:]=audio[-n:]*(1-fade)+seam*fade
    ff(['-f','f32le','-ar',str(SR),'-ac','2','-i','-',
        '-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(args.output)],audio.astype('<f4').tobytes())
    print(f'{args.output}: {len(audio)/SR:.3f} seconds, original recording, 91.2 BPM, pitch unchanged')
