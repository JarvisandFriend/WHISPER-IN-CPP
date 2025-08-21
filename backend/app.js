const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const cors = require("cors");

const app = express();
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use(cors());

const port = 3000;
const upload = multer({ dest: "uploads/" });

// Convert to WAV (mono, 16kHz)
const convertToWav = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    console.log(`🎙️ Starting FFmpeg conversion...`);
    console.log(`Input: ${inputPath}`);
    console.log(`Output: ${outputPath}`);

    ffmpeg(inputPath)
      .outputOptions(["-ac 1", "-ar 16000", "-acodec pcm_s16le"])
      .on("start", cmdLine => console.log("🔧 FFmpeg command:", cmdLine))
      .on("end", () => {
        console.log("✅ FFmpeg conversion completed.");
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("❌ FFmpeg error:", err.message);
        reject(err);
      })
      .save(outputPath);
  });
};

// Whisper endpoint
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  console.log("📥 Received transcription request");

  if (!req.file) {
    console.error("❌ No audio file received in request.");
    return res.status(400).send("No audio file received.");
  }

  console.log("📄 File received:", {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size + " bytes",
    path: req.file.path
  });

  try {
    const filePath = req.file.path;
    const wavPath = `${filePath}.wav`;

    console.log("🔄 Converting uploaded audio to WAV...");
    await convertToWav(filePath, wavPath);

    const modelPath = "./whisper.cpp/models/ggml-base.en.bin";
    const transcribeCmd = `./whisper.cpp/build/bin/whisper-cli -m ${modelPath} -f ${wavPath} -otxt`;

    console.log("🚀 Running Whisper...");
    console.log("Whisper CMD:", transcribeCmd);

    exec(transcribeCmd, (err, stdout, stderr) => {
      console.log("📤 Whisper STDOUT:", stdout || "(no stdout)");
      console.error("📛 Whisper STDERR:", stderr || "(no stderr)");

      if (err) {
        console.error("❌ Whisper process failed:", err.message);
        return res.status(500).send("Transcription failed.");
      }

      const txtPath = `${wavPath}.txt`;
      console.log(`📄 Looking for output text: ${txtPath}`);

      fs.readFile(txtPath, "utf8", (err, data) => {
        if (err) {
          console.error("❌ Error reading Whisper output:", err.message);
          return res.status(500).send("Text read error.");
        }

        const result = data.trim();
        console.log("📝 Transcription:", result || "(empty)");

        // Cleanup
        try {
          fs.unlinkSync(filePath);
          fs.unlinkSync(wavPath);
          fs.unlinkSync(txtPath);
          console.log("🧹 Temp files cleaned.");
        } catch (cleanupErr) {
          console.warn("⚠️ Cleanup error:", cleanupErr.message);
        }

        res.send({ transcription: result });
      });
    });
  } catch (error) {
    console.error("🔥 Unexpected error during transcription:", error.message);
    res.status(500).send("Internal error.");
  }
});

app.listen(port, () => {
  console.log(`✅ API running at: http://localhost:${port}`);
});
