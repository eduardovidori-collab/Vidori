"""Soften a copy of the v119 rain loop, preserving its duration and loop edges.

Usage: python tools/soften-cafe-rain.py /path/to/original-v119-rain.mp3
The input must be a separate copy, so running twice never attenuates the output
again. Requires numpy and ffmpeg. See audio/cafe/CREDITOS.md for source/license.
"""
import argparse
from pathlib import Path
import subprocess
import numpy as np

SR = 32000


def ff(args, data=None):
    return subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], input=data,
                          capture_output=True, check=True).stdout


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path,
                        default=Path(__file__).resolve().parents[1] / 'audio/cafe/chuva.mp3')
    args = parser.parse_args()
    if args.source.resolve() == args.output.resolve():
        parser.error('Input must be a separate copy of the original loop.')
    decoded = ff(['-i', str(args.source), '-ar', str(SR), '-ac', '2', '-f', 'f32le', '-'])
    audio = np.frombuffer(decoded, dtype='<f4').reshape(-1, 2)
    n = 3 * SR
    padded = np.concatenate([audio[-n:], audio, audio[:n]])
    filters = ('highshelf=f=1300:g=-4,lowpass=f=2400,'
               'acompressor=threshold=0.10:ratio=1.6:attack=80:release=900:makeup=1,'
               f'volume=-2.5dB,atrim=start_sample={n}:end_sample={n + len(audio)}')
    ff(['-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', filters,
        '-codec:a', 'libmp3lame', '-b:a', '96k', '-map_metadata', '-1', str(args.output)],
       padded.astype('<f4').tobytes())
    print(f'{args.output}: {len(audio) / SR:.3f}s, gentler high frequencies and droplets')
