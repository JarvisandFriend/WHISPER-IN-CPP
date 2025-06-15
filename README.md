# Whisper.cpp on Termux (Offline Speech-to-Text Setup)

This guide documents the full process of setting up and running [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) on Android using Termux, from scratch to successful audio transcription.

---

## ✅ Requirements

- Termux (Android Terminal Emulator)
- Stable internet connection
- At least 2 GB of free space
- Audio files in MP3/WAV format

---

## 📦 Step-by-Step Installation & Usage

### 1. Update packages & install dependencies

```bash
pkg update && pkg upgrade
pkg install git cmake ffmpeg clang python

```

# *Optional: Add Storage Access*

```sh
termux-setup-storage

```

## *Clone the whisper repository*

```sh
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp

```
*Build whisper.cpp*

```sh

cmake -B build
cmake --build build --config Release

```
*On success, binaries will appear under*

```bash
./build/bin/


```

## *Download whisper model*

```sh
cd models
./download-ggml-model.sh base.en

```
# *model path will be*

```sh
models/ggml-base.en.bin

```

*Convert audio to whisper compatible*

```sh

ffmpeg -i ../your-audio.mp3 -ar 16000 -ac 1 -c:a pcm_s16le ../your-audio.wav

```

## *Run transcription with a cli*

```bash
./build/bin/whisper-cli \
  -m models/ggml-base.en.bin \
  -f ../your-audio.wav \
  -otxt

```

*Your output will be saved as*

```bash
../your-audio.wav.txt

```
## ouput:

```bash
[00:00:00.000 --> 00:00:06.560] It's been a whirlwind of calculations...

```
