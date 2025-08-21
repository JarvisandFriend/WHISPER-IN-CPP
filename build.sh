#!/bin/bash

# 1️⃣ Install ffmpeg
sudo apt update && sudo apt install -y ffmpeg

# 2️⃣ Build whisper.cpp
cmake -S whisper.cpp -B whisper.cpp/build
cmake --build whisper.cpp/build --config Release

# 3️⃣ Download the model (if not already downloaded)
./whisper.cpp/models/download-ggml-model.sh base.en

# 4️⃣ Install backend dependencies
yarn --cwd backend install
