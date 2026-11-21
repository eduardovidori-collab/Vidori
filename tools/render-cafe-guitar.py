"""Render a quiet 5m37s piece preserving complete recorded guitar attacks.

Usage: python tools/render-cafe-guitar.py /path/to/source-folder --soundfont /path/to/FSBS-jazz.sf2
Requires numpy, scipy, libfluidsynth and ffmpeg with Rubber Band. Sources: HQ MP3 previews
689160 (main), 689161 (air 1), 689162 (air 2), 689159 (delay), all CC0:
https://freesound.org/people/deadrobotmusic/sounds/689160/
The three new sections use the CC0 FreePats FSBS Jazz Guitar 2026-08-07
sample bank, retaining each note's full recorded spectrum and string attack.
See audio/cafe/CREDITOS.md. This offline renderer never runs in the app.
"""
import argparse
import ctypes as C
import ctypes.util
from pathlib import Path
import subprocess
import numpy as np
from scipy import signal

SR=32000
TEMPO=.95
BEAT=60/96
SOURCE_SECONDS=320
OUTPUT_SAMPLES=round(SOURCE_SECONDS/TEMPO*SR)
SOURCES=[689160,689161,689162,689159]
MAX_LEAD_MIDI=65  # F4: the new melody stays below the original high lead.
CHORDS={
    'A#m7':[46,53,56,61], 'F#maj7':[42,49,53,58],
    'C#add9':[49,56,61,63], 'G#add9':[44,51,58,60],
    'D#m7':[51,54,58,61], 'G#sus2':[44,51,56,58],
    'C#/G#':[44,49,53,56],
}
# Each row is one bar. These are new note sequences, not donor-bar shuffles.
# Four eight-bar phrases per section develop the melody over changing chords.
MELODIES=[
    [
        'C#4 F4 D#4','C#4 A#3 C#4','A#3 C#4 F4','D#4 C#4 A#3',
        'G#3 C#4 D#4','F4 D#4 C#4','D#4 C4 A#3','G#3 A#3 C4',
        'F4 D#4 C#4','A#3 C#4 F4','C#4 A#3 F3','G#3 A#3 C#4',
        'F4 D#4 C#4','G#3 C#4 F4','D#4 A#3 G#3','C4 D#4 C4',
        'A#3 C#4 D#4','F4 C#4 A#3','F3 A#3 C#4','D#4 F4 C#4',
        'C#4 F4 D#4','C#4 G#3 C#4','A#3 C4 D#4','C4 A#3 G#3',
        'C#4 A#3 F3','G#3 A#3 C#4','D#4 C#4 A#3','F3 G#3 A#3',
        'G#3 C#4 F4','D#4 C#4 G#3','C4 D#4 A#3','G#3 A#3 C#4',
    ],
    [
        'A#3 C#4','D#4 A#3','G#3 A#3','C#4 D#4',
        'C#4 G#3','A#3 C#4','A#3 F3','G#3 A#3',
        'C#4 D#4','A#3 F#3','A#3 C#4','D#4 G#3',
        'G#3 C#4','D#4 C#4','F3 A#3','C#4 A#3',
        'D#4 C#4','A#3 D#4','C#4 A#3','G#3 D#4',
        'C#4 D#4','G#3 A#3','A#3 C#4','F3 G#3',
        'F#3 A#3','C#4 A#3','G#3 C#4','A#3 G#3',
        'D#4 C#4','A#3 G#3','F3 A#3','C#4 A#3',
    ],
    [
        'A#3 C#4 A#3','F3 G#3 A#3','C4 D#4 A#3','G#3 A#3 C4',
        'C#4 F4 D#4','C#4 A#3 G#3','G#3 C#4 F3','G#3 A#3 C#4',
        'C#4 A#3 F3','G#3 A#3 C#4','D#4 C4 A#3','G#3 D#4 C4',
        'F4 D#4 C#4','A#3 C#4 F4','C#4 G#3 F3','G#3 C#4 D#4',
        'A#3 F3 G#3','C#4 A#3 F3','A#3 C4 D#4','C4 A#3 G#3',
        'C#4 D#4 F4','D#4 C#4 A#3','F3 G#3 C#4','A#3 G#3 F3',
        'F3 A#3 C#4','D#4 C#4 A#3','G#3 C4 A#3','D#4 C4 G#3',
        'A#3 C#4 F4','D#4 C#4 A#3','G#3 F3 G#3','C#4 A#3 G#3',
    ],
]
PROGRESSIONS=[
    ['A#m7','F#maj7','C#add9','G#add9'],
    ['D#m7','G#sus2','C#add9','F#maj7'],
    ['F#maj7','G#add9','A#m7','C#/G#'],
]


def ff(args,data=None):
    return subprocess.run(['ffmpeg','-v','error','-y',*args],input=data,
                          capture_output=True,check=True).stdout


def rms(x):
    return float(np.sqrt(np.mean(x*x)))


def midi(name):
    letters={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
    return 12*(int(name[-1])+1)+letters[name[0]]+('#' in name)


def read_sources(folder):
    return {identifier:np.frombuffer(ff(['-i',str(folder/f'{identifier}.mp3'),
        '-ar',str(SR),'-ac','2','-f','f32le','-']),dtype='<f4').reshape(-1,2).copy()
        for identifier in SOURCES}


def recorded_theme(recordings,returning=False):
    gains=[(1,.10,.08,.03),(.95,.16,.10,.05),(.90,.20,.14,.08),(.85,.23,.18,.10)]
    stems=[]
    for identifier in SOURCES:
        source=recordings[identifier].copy()
        source/=max(rms(source[:40*SR]),1e-8)
        stems.append(source)
    audio=np.zeros((42*SR,2),dtype=np.float64)
    for phrase,balance in enumerate(gains):
        start=phrase*10*SR
        end=(phrase+1)*10*SR
        if phrase==3:end+=2*SR  # Keep the recorded final notes and their decay.
        block=sum(stem[start:end]*gain for stem,gain in zip(stems,balance))
        block/=rms(block[:min(len(block),10*SR)])
        if returning:
            block*=.94
        audio[start:end]=block
    return audio


def composed_section(index,soundfont):
    """Play the score with intact Fender guitar samples, including their attack."""
    rng=np.random.default_rng(20261121+index)
    notes=[]
    def note(time,key,velocity,channel,duration):
        assert 42<=key<=MAX_LEAD_MIDI
        start=max(0,time+rng.uniform(-.006,.006))
        notes.append([round(start*SR),round((start+duration)*SR),channel,key,
                      int(np.clip(velocity+rng.integers(-2,3),1,127))])
    bars=MELODIES[index]
    assert len(bars)==32
    for bar,row in enumerate(bars):
        start=bar*4*BEAT
        melody=[midi(n) for n in row.split()]
        assert max(melody)<=MAX_LEAD_MIDI
        chord=CHORDS[PROGRESSIONS[index][(bar//2)%4]]
        note(start,chord[0],43,0,3.9*BEAT)
        picking=[(.85,1),(2.4,2),(3.35,3)] if index!=1 else [(1.1,1),(2.9,2)]
        for offset,n in picking:
            note(start+offset*BEAT,chord[n],35 if index!=1 else 33,1,1.8*BEAT)
        offsets=[.3,1.8,3.15] if len(melody)==3 else [.45,2.55]
        for offset,key in zip(offsets,melody):
            note(start+offset*BEAT,key,48 if index!=1 else 45,2,1.45*BEAT)
    # A release from an earlier strike must not truncate a newer one.
    previous={}
    for item in sorted(notes):
        start,end,channel,key,velocity=item
        old=previous.get((channel,key))
        if old is not None:old[1]=min(old[1],start-round(.02*SR))
        previous[channel,key]=item
    events=sorted(event for start,end,ch,key,vel in notes
                  for event in [(start,1,ch,key,vel),(end,0,ch,key,0)])
    lib=C.CDLL(ctypes.util.find_library('fluidsynth'))
    def api(name,result,*args):
        f=getattr(lib,name);f.restype=result;f.argtypes=args;return f
    ptr=C.c_void_p
    settings=api('new_fluid_settings',ptr)()
    num=api('fluid_settings_setnum',C.c_int,ptr,C.c_char_p,C.c_double)
    integer=api('fluid_settings_setint',C.c_int,ptr,C.c_char_p,C.c_int)
    for name,value in [('synth.sample-rate',SR),('synth.gain',.6),
        ('synth.reverb.room-size',.45),('synth.reverb.damp',.75),
        ('synth.reverb.width',10),('synth.reverb.level',.13)]:
        num(settings,name.encode(),value)
    integer(settings,b'synth.chorus.active',0)
    integer(settings,b'synth.cpu-cores',1)
    synth=api('new_fluid_synth',ptr,ptr)(settings)
    sfid=api('fluid_synth_sfload',C.c_int,ptr,C.c_char_p,C.c_int)(synth,str(soundfont).encode(),0)
    assert sfid>=0,'Unable to load the recorded CC0 guitar bank'
    sf=api('fluid_synth_get_sfont_by_id',ptr,ptr,C.c_int)(synth,sfid)
    api('fluid_sfont_iteration_start',None,ptr)(sf)
    preset=api('fluid_sfont_iteration_next',ptr,ptr)(sf)
    bank=api('fluid_preset_get_banknum',C.c_int,ptr)(preset)
    program=api('fluid_preset_get_num',C.c_int,ptr)(preset)
    select=api('fluid_synth_program_select',C.c_int,ptr,C.c_int,C.c_int,C.c_int,C.c_int)
    cc=api('fluid_synth_cc',C.c_int,ptr,C.c_int,C.c_int,C.c_int)
    for ch,pan,volume in [(0,64,83),(1,54,73),(2,71,86)]:
        assert select(synth,ch,sfid,bank,program)==0
        cc(synth,ch,10,pan);cc(synth,ch,7,volume)
    on=api('fluid_synth_noteon',C.c_int,ptr,C.c_int,C.c_int,C.c_int)
    off=api('fluid_synth_noteoff',C.c_int,ptr,C.c_int,C.c_int)
    write=api('fluid_synth_write_float',C.c_int,ptr,C.c_int,ptr,C.c_int,C.c_int,ptr,C.c_int,C.c_int)
    total=82*SR;output=np.zeros((total,2),dtype=np.float32);cursor=0
    for frame,kind,ch,key,velocity in events+[(total,-1,0,0,0)]:
        frame=min(frame,total)
        if frame>cursor:
            block=np.empty((frame-cursor,2),dtype=np.float32)
            assert write(synth,len(block),block.ctypes.data,0,2,block.ctypes.data,1,2)==0
            output[cursor:frame]=block;cursor=frame
        if kind==1:on(synth,ch,key,velocity)
        elif kind==0:off(synth,ch,key)
    api('delete_fluid_synth',None,ptr)(synth)
    api('delete_fluid_settings',None,ptr)(settings)
    # Quiet, damped guitar echoes retain the dry string transient in front.
    wet=np.zeros_like(output)
    for delay,gain in [(BEAT,.10),(2*BEAT,.055)]:
        shift=round(delay*SR)
        wet[shift:]+=output[:-shift]*gain
    wet=signal.sosfilt(signal.butter(2,1600,fs=SR,output='sos'),wet,axis=0)
    output=output+wet
    output/=rms(output[:80*SR])
    return output

def arrange(folder,soundfont):
    recordings=read_sources(folder)
    sections=[recorded_theme(recordings)]+[composed_section(i,soundfont) for i in range(3)]+[recorded_theme(recordings,True)]
    durations=[40,80,80,80,40]
    audio=np.zeros(((SOURCE_SECONDS+2)*SR,2),dtype=np.float64)
    cursor=0
    for section,duration in zip(sections,durations):
        # Fade the incoming part while outgoing notes continue naturally.
        if cursor:
            n=round(.6*SR)
            section[:n]*=np.linspace(0,1,n)[:,None]
        tail=duration*SR
        section[tail:]*=np.linspace(1,0,len(section)-tail)[:,None]
        audio[cursor:cursor+len(section)]+=section
        cursor+=tail
    assert cursor==SOURCE_SECONDS*SR
    audio[:2*SR]+=audio[cursor:]
    return audio[:cursor].astype('<f4')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sources',type=Path)
    parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'audio/cafe/guitarra.mp3')
    parser.add_argument('--soundfont',type=Path,required=True,help='CC0 FSBS Jazz Guitar SF2 bank, 2026-08-07')
    args=parser.parse_args()
    raw=arrange(args.sources,args.soundfont)*.04
    # Warm-up prevents an initialization impulse on the sustaining room tail.
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
    audio*=min(10**(-25.6/20)/rms(audio),10**(-7.8/20)/abs(audio).max())
    n=round(.025*SR)
    seam=(audio[-1]+audio[0])/2
    fade=np.linspace(0,1,n)[:,None]
    audio[:n]=seam*(1-fade)+audio[:n]*fade
    audio[-n:]=audio[-n:]*(1-fade)+seam*fade
    ff(['-f','f32le','-ar',str(SR),'-ac','2','-i','-',
        '-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(args.output)],audio.astype('<f4').tobytes())
    print(f'{args.output}: {len(audio)/SR:.3f}s, intact recorded guitar samples + original theme, 91.2 BPM, new lead <= F4')
