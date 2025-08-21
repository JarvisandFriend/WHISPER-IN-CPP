const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "..", "frontend")));

const port = 3000;
const uploadDir = path.join(__dirname, "uploads");
const upload = multer({ dest: uploadDir });

// Convert audio to WAV (mono, 16kHz)
const convertToWav = (inputPath, outputPath) =>
  new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(["-ac 1", "-ar 16000", "-acodec pcm_s16le"])
      .on("end", () => resolve(outputPath))
      .on("error", err => reject(err))
      .save(outputPath);
});

// Whisper CLI and model
const whisperCli = path.join(__dirname, "..", "whisper.cpp", "build", "bin", "whisper-cli");
const whisperModel = path.join(__dirname, "..", "whisper.cpp", "models", "ggml-base.en.bin");

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).send("No audio file received.");

  const originalPath = req.file.path;
  const wavPath = `${originalPath}.wav`;
  const txtPath = `${wavPath}.txt`;

  try {
    await convertToWav(originalPath, wavPath);

    const whisper = spawn(whisperCli, ["-m", whisperModel, "-f", wavPath, "-otxt"]);

    whisper.on("close", code => {
      if (code !== 0) {
        cleanup();
        return res.status(500).send("Whisper failed.");
      }

      const transcription = fs.readFileSync(txtPath, "utf8").trim();
      cleanup();
      res.send({ transcription });
    });

    // Optional: capture stderr to debug silently
    whisper.stderr.on("data", () => {});

    function cleanup() {
      [originalPath, wavPath, txtPath].forEach(file => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
    }
  } catch (err) {
    [originalPath, wavPath, txtPath].forEach(file => fs.existsSync(file) && fs.unlinkSync(file));
    res.status(500).send("Internal error.");
  }
});

app.listen(port, () => {});
