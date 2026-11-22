"""Render a separate, varied guitar option without replacing the approved track.

Usage: python tools/render-cafe-guitar-variations.py ORIGINALS ETHEREAL
Folders contain the CC0 HQ MP3 previews listed in audio/cafe/CREDITOS.md.
Requires numpy and ffmpeg with Rubber Band. Only complete human performances
are used; no note extraction, MIDI or synthesized guitar.
"""
import argparse
from pathlib import Path
import subprocess
import numpy as np

SR = 32000
BPM = 91.2
BAR = 240 / BPM
# ID: original BPM, active bars. Decay tails are not extra musical bars.
TAKES = {
    689160: (96, 16), 688077: (96, 16), 688072: (100, 12),
    688074: (87, 8), 688073: (80, 8), 688076: (93, 8),
    688075: (87, 8), 688071: (100, 8),
}
ORDER = [689160, 688077, 688072, 688074, 688073, 688076,
         688075, 688071, 688072, 688077, 689160]


def ff(args, data=None):
    return subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], input=data,
                          capture_output=True, check=True).stdout


def rms(x):
    return float(np.sqrt(np.mean(x * x)))


def prepare(path, bpm, bars, pitch):
    decoded = ff(['-i', str(path), '-ar', str(SR), '-ac', '2', '-f', 'f32le', '-'])
    raw = np.frombuffer(decoded, dtype='<f4').reshape(-1, 2)
    # Silence before the first picked note warms up the stretcher. Retain all
    # recorded release after the final bar for the transition into the next take.
    warmup = 4 * SR
    padded = np.concatenate([np.zeros((warmup, 2)), raw, np.zeros((warmup, 2))])
    tempo = BPM / bpm
    start = round(warmup / tempo)
    body = round(bars * BAR * SR)
    tail = 2 * SR
    filters = (
        f'rubberband=tempo={tempo}:pitch={pitch}:transients=mixed:detector=soft:'
        'phase=laminar:window=long:smoothing=on:channels=together,'
        'highpass=f=85,highshelf=f=1200:g=-6,lowpass=f=4200,'
        f'atrim=start_sample={start}:end_sample={start + body + tail}'
    )
    result = ff(['-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                 '-af', filters, '-f', 'f32le', '-'], padded.astype('<f4').tobytes())
    audio = np.frombuffer(result, dtype='<f4').reshape(-1, 2).copy()
    audio /= max(rms(audio[:body]), 1e-8)
    # Match volume with a constant gain, keeping the player's natural dynamics.
    n = round(.018 * SR)
    audio[:n] *= np.linspace(0, 1, n)[:, None]
    audio[body:] *= np.linspace(1, 0, len(audio) - body)[:, None]
    return audio


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('originals', type=Path)
    parser.add_argument('ethereal', type=Path)
    parser.add_argument('--output', type=Path,
                        default=Path(__file__).resolve().parents[1] / 'audio/cafe/guitarra-variada.mp3')
    args = parser.parse_args()
    prepared = {}
    for identifier, (bpm, bars) in TAKES.items():
        original = identifier == 689160
        folder = args.originals if original else args.ethereal
        # B minor -> A# minor; E minor/major -> D# minor/major. This modest
        # whole-performance transposition preserves attacks and string decay.
        pitch = 1 if original else 2 ** (-1 / 12)
        prepared[identifier] = prepare(folder / f'{identifier}.mp3', bpm, bars, pitch)
    bars_total = sum(TAKES[i][1] for i in ORDER)
    assert bars_total == 128
    total = round(bars_total * BAR * SR)
    audio = np.zeros((total + 2 * SR, 2), dtype=np.float64)
    bar = 0
    for identifier in ORDER:
        start = round(bar * BAR * SR)
        take = prepared[identifier]
        audio[start:start + len(take)] += take
        bar += TAKES[identifier][1]
    # Fold only the final release into the beginning for uninterrupted looping.
    audio[:2 * SR] += audio[total:]
    audio = audio[:total]
    audio *= min(10 ** (-25.6 / 20) / rms(audio),
                 10 ** (-7.8 / 20) / np.max(np.abs(audio)))
    n = round(.025 * SR)
    seam = (audio[-1] + audio[0]) / 2
    fade = np.linspace(0, 1, n)[:, None]
    audio[:n] = seam * (1 - fade) + audio[:n] * fade
    audio[-n:] = audio[-n:] * (1 - fade) + seam * fade
    ff(['-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-codec:a',
        'libmp3lame', '-b:a', '96k', '-map_metadata', '-1', str(args.output)],
       audio.astype('<f4').tobytes())
    print(f'{args.output}: {total / SR:.3f}s, {BPM} BPM, eight recorded themes')
