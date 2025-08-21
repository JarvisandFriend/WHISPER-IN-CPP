#!/bin/bash
#install ffmpeg
sudo apt update && sudo apt install -y ffmpeg
# Run this after cloning your project
cmake -S whisper.cpp -B whisper.cpp/build && cmake --build whisper.cpp/build --config Release
# Download a model if not already there
./whisper.cpp/models/download-ggml-model.sh base.en && yarn --cwd ./backend install 
