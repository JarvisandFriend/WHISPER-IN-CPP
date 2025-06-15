const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
const port = 3000;

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, "../frontend")));

// Setup Multer for file upload
const upload = multer({ dest: "uploads/" }); // make sure 'uploads/' exists

// POST /transcribe
app.post("/transcribe", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded." });
  }

  const inputPath = req.file.path;
  const outputWav = `uploads/${req.file.filename}.wav`;

  const ffmpegCmd = `ffmpeg -y -i ${inputPath} -ar 16000 -ac 1 -c:a pcm_s16le ${outputWav}`;
  const modelPath = path.resolve(__dirname, "../whisper.cpp/models/ggml-base.en.bin");
  const whisperCmd = `../whisper.cpp/build/bin/whisper-cli -m ${modelPath} -f ${outputWav} -otxt`;

  exec(ffmpegCmd, (err) => {
    if (err) return res.status(500).json({ error: "FFmpeg conversion failed", details: err.toString() });

    exec(whisperCmd, (err) => {
      if (err) return res.status(500).json({ error: "Whisper failed", details: err.toString() });

      fs.readFile(`${outputWav}.txt`, "utf8", (err, data) => {
        if (err) return res.status(500).json({ error: "Failed to read transcription" });

        // Cleanup temp files (optional)
        fs.unlink(inputPath, () => {});
        fs.unlink(outputWav, () => {});
        fs.unlink(`${outputWav}.txt`, () => {});

        res.json({ transcription: data.trim() });
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Whisper full-stack app running: http://localhost:${port}`);
});

