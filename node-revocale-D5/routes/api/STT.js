const express = require('express');
const sttRouter = express.Router();
const gClient = require('@google-cloud/speech');

sttRouter.post('/', async function(req, res)
{
    let client = new gClient.SpeechClient();
    let audio = req.body;
    console.log(audio);
    const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
    };
    const request = {
        audio: audio,
        config: config,
    };
    const [response] = await client.recognize(request);
    const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
    console.log(`Transcription: ${transcription}`);
    res.send(transcription);
})

module.exports = sttRouter;