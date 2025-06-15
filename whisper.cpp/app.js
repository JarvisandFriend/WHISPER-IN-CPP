const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const WebSocket = require("ws");
const http = require("http");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const upload = multer({ dest: "uploads/" });

const MODEL_PATH = path.join(__dirname, "../models/ggml-base.en.bin");
const WHISPER_CLI = path.join(__dirname, "../whisper.cpp/build/bin/whisper-cli");

// REST Upload Endpoint
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  const inputPath = req.file.path;
  const outputWav = inputPath + ".wav";

  ffmpeg(inputPath)
    .outputOptions(["-ar 16000", "-ac 1", "-c:a pcm_s16le"])
    .on("end", () => {
      const cmd = `${WHISPER_CLI} -m ${MODEL_PATH} -f ${outputWav} -otxt`;
      exec(cmd, (err) => {
        if (err) return res.status(500).send("Whisper error");

        fs.readFile(outputWav + ".txt", "utf8", (err, data) => {
          if (err) return res.status(500).send("Read error");
          res.json({ transcript: data });
        });
      });
    })
    .on("error", err => res.status(500).send("FFmpeg error"))
    .save(outputWav);
});

// WebSocket Stream Transcription
wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  const tmpFile = path.join(__dirname, `uploads/stream-${Date.now()}.webm`);
  const outputWav = tmpFile.replace(".webm", ".wav");
  const writeStream = fs.createWriteStream(tmpFile);

  ws.on("message", (chunk) => {
    writeStream.write(chunk);
  });

  ws.on("close", () => {
    writeStream.end();
    ffmpeg(tmpFile)
      .outputOptions(["-ar 16000", "-ac 1", "-c:a pcm_s16le"])
      .on("end", () => {
        const cmd = `${WHISPER_CLI} -m ${MODEL_PATH} -f ${outputWav} -otxt`;
        exec(cmd, (err) => {
          if (err) return;
          fs.readFile(outputWav + ".txt", "utf8", (err, data) => {
            if (err) return;
            ws.send(JSON.stringify({ transcript: data }));
          });
        });
      })
      .on("error", err => ws.send(JSON.stringify({ error: "FFmpeg failed" })))
      .save(outputWav);
  });
});

server.listen(3000, () => console.log("🧠 API + WS running on http://localhost:3000"));
