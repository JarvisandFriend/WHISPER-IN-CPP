#!/bin/bash
# Run this after cloning your project
cd whisper.cpp && cmake -B build && cmake --build build --config Release
# Download a model if not already there
cd models
./download-ggml-model.sh base.en && cd .. && cd .. && cd backend && node app.js

