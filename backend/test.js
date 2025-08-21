const whisper = require('whisper-node');

whisper('jarvis.wav').then(transcript => {
  console.log(transcript);
}).catch(err => {
  console.error('Error:', err);
});
