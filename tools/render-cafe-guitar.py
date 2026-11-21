"""Render a quiet 5m37s guitar piece with three newly scored middle sections.

Usage: python tools/render-cafe-guitar.py /path/to/source-folder
Requires numpy, scipy and ffmpeg with Rubber Band. Sources: HQ MP3 previews
689160 (main), 689161 (air 1), 689162 (air 2), 689159 (delay), all CC0:
https://freesound.org/people/deadrobotmusic/sounds/689160/
See audio/cafe/CREDITOS.md. This offline renderer never runs in the app.
"""
import argparse
from fractions import Fraction
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


def extract_note(recording,start,duration,fundamental):
    """Keep a recorded guitar note's harmonic bands and stereo phase.

    This removes the other simultaneous pitches before the note is resampled
    into the score. No new oscillator, soundfont, or noise bed is introduced.
    """
    padding=.16
    first=max(0,round((start-padding)*SR))
    chunk=recording[first:round((start+duration+padding)*SR)]
    frequencies,_,spectrum=signal.stft(chunk,SR,nperseg=4096,noverlap=3584,axis=0)
    mask=np.zeros(len(frequencies))
    for harmonic in range(1,9):
        centre=fundamental*harmonic
        width=11+harmonic*1.7
        mask=np.maximum(mask,np.exp(-.5*((frequencies-centre)/width)**4))
    mask[frequencies>4000]=0
    _,audio=signal.istft(spectrum*mask[:,None,None],SR,nperseg=4096,
                       noverlap=3584,freq_axis=0,time_axis=-1)
    if audio.shape[0]==2:audio=audio.T
    offset=round(start*SR)-first
    audio=audio[offset:offset+round(duration*SR)].copy()
    edge=min(round(.02*SR),len(audio)//3)
    audio[:edge]*=np.linspace(0,1,edge)[:,None]
    audio[-edge:]*=np.linspace(1,0,edge)[:,None]
    return (audio/max(rms(audio),1e-8)).astype('<f4')


def dark_room(audio):
    # Only delayed guitar signal: no synthetic hiss. Damping keeps the room dark.
    wet=np.zeros_like(audio)
    taps=[.047,.071,.113,.157,.227,.313,.419,.557,.719,.911,1.137,1.401]
    for i,delay in enumerate(taps):
        for channel in range(2):
            samples=round((delay+(channel-.5)*(.004 if i%2 else -.004))*SR)
            gain=.085*np.exp(-delay/.65)
            wet[samples:,channel]+=audio[:-samples,channel]*gain
    wet=signal.sosfilt(signal.butter(2,1500,fs=SR,output='sos'),wet,axis=0)
    return audio+wet


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


def composed_section(index,samples):
    rng=np.random.default_rng(20261121+index)
    output=np.zeros((82*SR,2),dtype=np.float64)
    cache={}
    def play(time,key,gain,voice='body',length=None):
        assert 42<=key<=MAX_LEAD_MIDI
        token=(voice,key)
        if token not in cache:
            base,frequency=samples[voice]
            ratio=Fraction(frequency/(440*2**((key-69)/12))).limit_denominator(2048)
            sound=signal.resample_poly(base,ratio.numerator,ratio.denominator,axis=0)
            cache[token]=sound.astype('<f4')
        sound=cache[token]
        if length and len(sound)>round(length*SR):
            sound=sound[:round(length*SR)].copy()
            edge=min(round(.12*SR),len(sound)//3)
            sound[-edge:]*=np.linspace(1,0,edge)[:,None]
        start=round(max(0,time+rng.uniform(-.008,.008))*SR)
        size=min(len(sound),len(output)-start)
        output[start:start+size]+=sound[:size]*gain*rng.uniform(.96,1.04)
    bars=MELODIES[index]
    assert len(bars)==32
    for bar,row in enumerate(bars):
        start=bar*4*BEAT
        notes=[midi(n) for n in row.split()]
        assert max(notes)<=MAX_LEAD_MIDI
        chord=CHORDS[PROGRESSIONS[index][(bar//2)%4]]
        play(start,chord[0],.145,length=4.1*BEAT)
        # The central section has fewer plucks and two melody notes per bar.
        picking=[(.85,1),(2.4,2),(3.35,3)] if index!=1 else [(1.1,1),(2.9,2)]
        for offset,n in picking:
            play(start+offset*BEAT,chord[n],.061 if index!=1 else .054,length=2.2*BEAT)
        offsets=[.3,1.8,3.15] if len(notes)==3 else [.45,2.55]
        for offset,key in zip(offsets,notes):
            play(start+offset*BEAT,key,.205 if index!=1 else .19,'lead')
    output=dark_room(output)
    output/=rms(output[:80*SR])
    return output


def arrange(folder):
    recordings=read_sources(folder)
    # Lead note from the main guitar, moved down into the middle register;
    # accompaniment note from the same session's warm delay guitar.
    samples={
        'lead':(extract_note(recordings[689160],.625,.285,699.5),699.5),
        'body':(extract_note(recordings[689159],.012,1.12,277.6),277.6),
    }
    sections=[recorded_theme(recordings)]+[composed_section(i,samples) for i in range(3)]+[recorded_theme(recordings,True)]
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
    args=parser.parse_args()
    raw=arrange(args.sources)*.04
    # Warm-up prevents an initialization impulse on the sustaining room tail.
    padding=4*SR
    raw=np.concatenate([raw[-padding:],raw,raw[:padding]])
    warmup=round(padding/TEMPO)
    filters=(f'rubberband=tempo={TEMPO}:pitch=1:transients=mixed:detector=soft:'
             'phase=laminar:window=long:smoothing=on:channels=together,'
             'highpass=f=75,highshelf=f=1100:g=-6,lowpass=f=2800,'
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
    print(f'{args.output}: {len(audio)/SR:.3f}s, original theme + three new scores, 91.2 BPM, new lead <= F4')
