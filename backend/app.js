const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
app.use(express.static(path.join(__dirname,'..','frontend')));
const port = 3000;

// Upload config
const upload = multer({ dest: "uploads/" });

// Convert to WAV (mono, 16kHz)
const convertToWav = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(["-ac 1", "-ar 16000", "-acodec pcm_s16le"])
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .save(outputPath);
  });
};

// Whisper endpoint
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const wavPath = `${filePath}.wav`;

    // Convert any audio format to proper .wav
    await convertToWav(filePath, wavPath);

    const modelPath = "../whisper.cpp/models/ggml-base.en.bin";
    const transcribeCmd = `../whisper.cpp/build/bin/whisper-cli -m ${modelPath} -f ${wavPath} -otxt`;

    // Run whisper
    exec(transcribeCmd, (err) => {
      if (err) {
        console.error("Whisper error:", err);
        return res.status(500).send("Transcription failed");
      }

      const txtPath = `${wavPath}.txt`;
      fs.readFile(txtPath, "utf8", (err, data) => {
        if (err) return res.status(500).send("Text read error");

        // Clean up
        fs.unlinkSync(filePath);
        fs.unlinkSync(wavPath);
        fs.unlinkSync(txtPath);

        res.send({ transcription: data.trim() });
      });
    });
  } catch (error) {
    console.error("FFmpeg or whisper failed:", error);
    res.status(500).send("Internal error");
  }
});

app.listen(port, () => {
  console.log(`🚀 API ready at http://localhost:${port}`);
});

