"""Render the cafe's continuous 150-second guitar arrangement (offline only).

Usage: python tools/render-cafe-guitar.py /path/to/EGuitarFSBS-jazz.sf2
Requires numpy, ffmpeg and libfluidsynth. CC0 sampled instrument:
https://freepats.zenvoid.org/ElectricGuitar/clean-electric-guitar.html
Bank version: 2026-08-07, full SF2 bridge variant.
"""
import argparse
import ctypes as C
import ctypes.util
from pathlib import Path
import subprocess
import numpy as np

SR, SECONDS, BPM = 32000, 150, 76.8
BEAT = 60 / BPM
VOICINGS = {
    'Em9': [40, 47, 55, 62, 66], 'Em7': [40, 47, 55, 59, 62],
    'Cmaj7': [48, 55, 59, 64, 67], 'Gmaj7': [43, 50, 55, 59, 66],
    'Dadd9': [50, 57, 62, 64, 66], 'Am7': [45, 52, 55, 60, 64],
    'Dsus4': [50, 57, 62, 67, 69], 'D': [50, 57, 62, 66, 69],
    'Bm7': [47, 54, 57, 62, 66], 'G/B': [47, 50, 55, 59, 67],
    'Am9': [45, 52, 55, 59, 64], 'C/E': [40, 48, 55, 59, 64],
    'B7': [47, 54, 57, 63, 66],
}
# Three sixteen-bar sections. The final section recalls the opening with new
# phrasing; no section is a copied audio loop. Picking and melody evolve together.
SCORE = [
    ('Em9', [67,66,64]), ('Cmaj7', [64,62,59]), ('Gmaj7', [62,66,67]), ('Dadd9', [69,66,64]),
    ('Am7', [67,64,60]), ('Cmaj7', [64,67,71]), ('Dsus4', [69,67,64]), ('D', [66,64,62]),
    ('Em7', [64,67,66]), ('Gmaj7', [67,71,69]), ('Cmaj7', [67,64,62]), ('Bm7', [66,62,59]),
    ('Am7', [60,64,67]), ('Dadd9', [66,69,64]), ('Gmaj7', [67,66,62]), ('Bm7', [62,59,66]),
    ('Cmaj7', [71,67,64]), ('G/B', [69,67,62]), ('Am7', [67,64,60]), ('Em7', [62,64,67]),
    ('Am9', [71,69,64]), ('C/E', [67,64,59]), ('Dsus4', [64,67,69]), ('D', [69,66,62]),
    ('Cmaj7', [64,67,69]), ('Dadd9', [66,64,69]), ('Bm7', [71,66,62]), ('Em9', [67,66,64]),
    ('Am7', [69,67,64]), ('Cmaj7', [67,64,71]), ('Bm7', [66,62,64]), ('B7', [66,63,59]),
    ('Em9', [64,66,67]), ('Cmaj7', [71,69,67]), ('Gmaj7', [67,62,66]), ('Dadd9', [64,66,69]),
    ('Em7', [67,64,62]), ('Bm7', [62,66,69]), ('Cmaj7', [71,67,64]), ('Am7', [64,60,67]),
    ('Gmaj7', [71,69,67]), ('Dadd9', [69,64,66]), ('Em9', [66,67,64]), ('Cmaj7', [64,62,67]),
    ('Am7', [67,64,60]), ('Bm7', [62,59,66]), ('Em9', [67,66,64]), ('Em9', [62,66,64]),
]
PATTERNS = [
    [(0,0),(.55,1),(1.15,2),(1.9,3),(2.6,4),(3.4,2)],
    [(0,0),(.7,2),(1.4,3),(2.1,1),(2.8,4),(3.55,3)],
    [(0,0),(.6,1),(1.25,3),(2,4),(2.65,2),(3.35,1)],
    [(0,0),(.8,3),(1.5,2),(2.2,4),(2.9,1),(3.6,3)],
]

def make_events():
    rng = np.random.default_rng(271127)
    notes = []
    def note(t, channel, key, velocity, duration):
        t = max(0, t + rng.uniform(-.009,.009))
        notes.append([round(t*SR),round((t+duration)*SR),channel,key,velocity])
    for bar, (chord, melody) in enumerate(SCORE):
        start = bar*4*BEAT
        for j, (offset, index) in enumerate(PATTERNS[bar%4]):
            note(start+offset*BEAT,0,VOICINGS[chord][index],
                 int(35+(j==0)*6+rng.integers(-2,3)), (2.5 if j==0 else 1.15)*BEAT)
        offsets = [[.25,1.65,3.05],[.4,1.9,3.25],[.2,1.55,2.95],[.45,1.8,3.3]][bar%4]
        for j, (offset,key) in enumerate(zip(offsets,melody)):
            note(start+offset*BEAT,1,key,int(49+[2,0,-2][j]+rng.integers(-2,3)),1.55*BEAT)
    # Releasing an earlier strike must not cut a later strike of the same string.
    previous = {}
    for entry in sorted(notes):
        start,end,channel,key,velocity = entry
        old = previous.get((channel,key))
        if old is not None: old[1] = min(old[1],start-round(.02*SR))
        previous[channel,key] = entry
    return sorted(event for start,end,ch,key,velocity in notes
                  for event in [(start,1,ch,key,velocity),(end,0,ch,key,0)])

def render(bank):
    lib = C.CDLL(ctypes.util.find_library('fluidsynth'))
    def api(name, result, *args):
        f=getattr(lib,name); f.restype=result; f.argtypes=args; return f
    ptr=C.c_void_p
    settings=api('new_fluid_settings',ptr)()
    num=api('fluid_settings_setnum',C.c_int,ptr,C.c_char_p,C.c_double)
    integer=api('fluid_settings_setint',C.c_int,ptr,C.c_char_p,C.c_int)
    for name,value in [('synth.sample-rate',SR),('synth.gain',.55),
        ('synth.reverb.room-size',.58),('synth.reverb.damp',.72),
        ('synth.reverb.width',15),('synth.reverb.level',.16)]:
        num(settings,name.encode(),value)
    integer(settings,b'synth.chorus.active',0)
    integer(settings,b'synth.cpu-cores',1)
    synth=api('new_fluid_synth',ptr,ptr)(settings)
    sfid=api('fluid_synth_sfload',C.c_int,ptr,C.c_char_p,C.c_int)(synth,str(bank).encode(),0)
    assert sfid>=0,'Cannot load the CC0 guitar bank'
    sf=api('fluid_synth_get_sfont_by_id',ptr,ptr,C.c_int)(synth,sfid)
    api('fluid_sfont_iteration_start',None,ptr)(sf)
    preset=api('fluid_sfont_iteration_next',ptr,ptr)(sf)
    banknum=api('fluid_preset_get_banknum',C.c_int,ptr)(preset)
    program=api('fluid_preset_get_num',C.c_int,ptr)(preset)
    select=api('fluid_synth_program_select',C.c_int,ptr,C.c_int,C.c_int,C.c_int,C.c_int)
    cc=api('fluid_synth_cc',C.c_int,ptr,C.c_int,C.c_int,C.c_int)
    for channel,pan in [(0,59),(1,69)]:
        assert select(synth,channel,sfid,banknum,program)==0
        cc(synth,channel,10,pan)
    on=api('fluid_synth_noteon',C.c_int,ptr,C.c_int,C.c_int,C.c_int)
    off=api('fluid_synth_noteoff',C.c_int,ptr,C.c_int,C.c_int)
    write=api('fluid_synth_write_float',C.c_int,ptr,C.c_int,ptr,C.c_int,C.c_int,ptr,C.c_int,C.c_int)
    # First pass warms up releases and room tails. The second is exported so
    # the 150-second boundary keeps the same sustaining guitar as the start.
    total=SECONDS*SR*2
    events=make_events()
    events=sorted((frame+cycle*SECONDS*SR,kind,ch,key,vel)
                  for cycle in [0,1] for frame,kind,ch,key,vel in events)
    audio=np.zeros((total,2),dtype=np.float32);cursor=0
    for frame,kind,ch,key,velocity in events+[(total,-1,0,0,0)]:
        if frame>=total: frame=total;kind=-1
        if frame>cursor:
            block=np.empty((frame-cursor,2),dtype=np.float32)
            assert write(synth,len(block),block.ctypes.data,0,2,block.ctypes.data,1,2)==0
            audio[cursor:frame]=block;cursor=frame
        if kind==1:on(synth,ch,key,velocity)
        elif kind==0:off(synth,ch,key)
    api('delete_fluid_synth',None,ptr)(synth)
    api('delete_fluid_settings',None,ptr)(settings)
    return audio

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('soundfont',type=Path)
    parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'audio/cafe/guitarra.mp3')
    args=parser.parse_args()
    audio=render(args.soundfont)
    # Filter both passes before trimming; filter history also survives the seam.
    cmd=['ffmpeg','-v','error','-f','f32le','-ar',str(SR),'-ac','2','-i','-',
         '-af','highpass=f=80,highshelf=f=2400:g=-3,lowpass=f=5600',
         '-f','f32le','-ar',str(SR),'-ac','2','-']
    processed=subprocess.run(cmd,input=audio.tobytes(),capture_output=True,check=True).stdout
    audio=np.frombuffer(processed,dtype='<f4').reshape(-1,2)[SECONDS*SR:].copy()
    # Constant gain; never amplify silence between notes with dynamic normalizing.
    audio*=10**(-10.5/20)/abs(audio).max()
    # A 16ms cyclic interpolation removes any residual waveform discontinuity.
    n=round(.016*SR);seam=(audio[-1]+audio[0])/2
    fade=np.linspace(0,1,n)[:,None]
    audio[:n]=seam*(1-fade)+audio[:n]*fade
    audio[-n:]=audio[-n:]*(1-fade)+seam*fade
    subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-',
        '-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(args.output)],
        input=audio.astype('<f4').tobytes(),capture_output=True,check=True)
    print(f'{args.output}: {len(audio)/SR:.3f}s, {len(SCORE)} bars, {BPM} BPM, peak -10.5dBFS')
