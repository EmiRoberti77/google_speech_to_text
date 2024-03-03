const speech = require('@google-cloud/speech');
const recorder = require('node-record-lpcm16');
const { Transform } = require('stream');

const client = new speech.SpeechClient();

const request = {
  config: {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  },
  interimResults: true,
};

const recognizeStream = client
  .streamingRecognize(request)
  .on('error', console.error)
  .on('data', (data) =>
    process.stdout.write(
      data.results[0] && data.results[0].alternatives[0]
        ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
        : '\n\nReached transcription time limit, press Ctrl+C\n'
    )
  );

const toLineStream = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  },
  flush(callback) {
    callback();
  },
});

// Start recording and send the microphone input to the Speech API
recorder
  .record({
    sampleRateHertz: 16000,
    threshold: 0, // Silence threshold
    recordProgram: 'rec', // Try also "arecord" or "sox"
    silence: '10.0', // Seconds of silence before ending
  })
  .stream()
  .pipe(toLineStream)
  .pipe(recognizeStream);

console.log('Listening, press Ctrl+C to stop.');
