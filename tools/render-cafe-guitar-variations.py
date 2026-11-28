"""Render the extended cafe guitar from 21 complete CC0 guitar performances.

Usage: python tools/render-cafe-guitar-variations.py ORIGINALS ETHEREAL ADDITIONS
Folders contain ID.mp3 HQ previews listed in audio/cafe/CREDITOS.md.
No synthesized instruments, repeated takes, copied track or slowed original.
All performances share the already-approved 91.2 BPM, with modest whole-take
transposition and the same warm EQ. Requires numpy and ffmpeg/Rubber Band.
"""
import argparse
from pathlib import Path
import subprocess
import json
import numpy as np

SR = 32000
BPM = 91.2
BAR = 240 / BPM
# ID: original BPM, active bars, pitch change in semitones, source folder.
# Final reverb tails are release, never extra musical bars.
TAKES = {
    689160: (96,16,0,'originals'),
    688077: (96,16,-1,'ethereal'), 688072: (100,12,-1,'ethereal'),
    688074: (87,8,-1,'ethereal'), 688073: (80,8,-1,'ethereal'),
    688076: (93,8,-1,'ethereal'), 688075: (87,8,-1,'ethereal'),
    688071: (100,8,-1,'ethereal'),
    689161: (96,16,0,'originals'), 689162: (96,16,0,'originals'),
    699041: (100,8,-1,'additions'),
    587820: (95,4,0,'additions'), 587819: (87,4,0,'additions'),
    652319: (96,16,-2,'additions'), 652318: (96,16,-2,'additions'),
    575300: (88,4,-1,'additions'), 575301: (96,4,-1,'additions'),
    575297: (98,8,-1,'additions'), 627624: (108,16,-3,'additions'),
    627035: (114,8,1,'additions'), 627036: (114,8,1,'additions'),
}
# A# minor -> D# minor -> D# major -> D# minor -> A# minor/C# major.
# Related keys give the new melodies room without abrupt harmonic jumps.
ORDER = [689160,699041,688077,689161,587820,688073,652319,
         575300,627624,587819,688076,575301,652318,575297,
         688074,627035,688072,627036,688075,689162,688071]
# These performances finish with release bars. The next guitar enters on
# that bar while the natural decay continues, avoiding a silent pause.
OVERLAP_BARS = {652319:1,652318:2}


def ff(args, data=None):
    return subprocess.run(['ffmpeg','-v','error','-y',*args],input=data,
                          capture_output=True,check=True).stdout


def rms(x):
    return float(np.sqrt(np.mean(x*x)))


def prepare(path,bpm,bars,semitones):
    decoded=ff(['-i',str(path),'-ar',str(SR),'-ac','2','-f','f32le','-'])
    raw=np.frombuffer(decoded,dtype='<f4').reshape(-1,2)
    tempo=BPM/bpm
    body=round(bars*BAR*SR)
    source_body=round(bars*240/bpm*SR)
    # Each source is a complete performance; do not loop a short source to fit.
    if len(raw)<source_body-int(.08*SR):
        raise ValueError(f'{path.name}: {len(raw)/SR}s cannot supply {bars} bars')
    warmup=4*SR
    padded=np.concatenate([np.zeros((warmup,2)),raw,np.zeros((warmup,2))])
    start=round(warmup/tempo)
    tail=2*SR
    pitch=2**(semitones/12)
    softer='highshelf=f=1600:g=-4.5,' if path.stem in {'689161','689162','699041','587820','587819','652319','652318','575300','575301','575297','627624','627035','627036'} else ''
    filters=(f'rubberband=tempo={tempo}:pitch={pitch}:transients=mixed:'
             'detector=soft:phase=laminar:window=long:smoothing=on:channels=together,'
             'highpass=f=85,highshelf=f=1200:g=-6,'+softer+'lowpass=f=4200,'
             f'atrim=start_sample={start}:end_sample={start+body+tail}')
    result=ff(['-f','f32le','-ar',str(SR),'-ac','2','-i','-',
               '-af',filters,'-f','f32le','-'],padded.astype('<f4').tobytes())
    audio=np.frombuffer(result,dtype='<f4').reshape(-1,2).copy()
    if len(audio)<body+tail:
        audio=np.pad(audio,((0,body+tail-len(audio)),(0,0)))
    audio=audio[:body+tail]
    # Constant volume per performance preserves playing dynamics and avoids
    # pumping the noise floor up between notes.
    audio/=max(rms(audio[:body]),1e-8)
    attack=round(.025*SR)
    audio[:attack]*=np.sin(np.linspace(0,np.pi/2,attack))[:,None]
    audio[body:]*=np.cos(np.linspace(0,np.pi/2,tail))[:,None]**2
    return audio


def render(folders,output,report=None):
    assert len(ORDER)==len(set(ORDER))==len(TAKES)==21
    bars_total=sum(TAKES[i][1] for i in ORDER)
    assert bars_total==212
    timeline_bars=bars_total-sum(OVERLAP_BARS.values())
    assert timeline_bars==209
    total=round(timeline_bars*BAR*SR)
    audio=np.zeros((total+2*SR,2),dtype=np.float64)
    bar=0;sections=[]
    for identifier in ORDER:
        bpm,bars,pitch,folder=TAKES[identifier]
        take=prepare(folders[folder]/f'{identifier}.mp3',bpm,bars,pitch)
        start=round(bar*BAR*SR)
        audio[start:start+len(take)]+=take
        sections.append({'id':identifier,'start':start/SR,'end':(bar+bars)*BAR,
                         'bars':bars,'pitch_semitones':pitch})
        print(f'{identifier}: {bars} bars at {start/SR:.2f}s',flush=True)
        bar+=bars-OVERLAP_BARS.get(identifier,0)
    # Sustain the last performance into the start, only for the natural loop
    # seam. The complete track never restarts in the middle of this arrangement.
    audio[:2*SR]+=audio[total:]
    audio=audio[:total]
    audio*=min(10**(-25.6/20)/rms(audio),
               10**(-7.8/20)/np.max(np.abs(audio)))
    edge=round(.025*SR)
    fade=np.sin(np.linspace(0,np.pi/2,edge))[:,None]
    audio[:edge]*=fade
    audio[-edge:]*=fade[::-1]
    ff(['-f','f32le','-ar',str(SR),'-ac','2','-i','-','-codec:a',
        'libmp3lame','-b:a','96k','-map_metadata','-1',str(output)],
       audio.astype('<f4').tobytes())
    if report:
        report.write_text(json.dumps({'duration':total/SR,'bpm':BPM,
            'performances':len(ORDER),'new_to_option':13,'timeline_bars':timeline_bars,'overlap_bars':OVERLAP_BARS,'sections':sections},indent=2))
    print(f'{output}: {total/SR:.3f}s, {BPM} BPM, 21 distinct performances')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for folder in ['originals','ethereal','additions']:parser.add_argument(folder,type=Path)
    parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'audio/cafe/guitarra-variada.mp3')
    parser.add_argument('--report',type=Path)
    args=parser.parse_args()
    render({f:getattr(args,f) for f in ['originals','ethereal','additions']},args.output,args.report)
