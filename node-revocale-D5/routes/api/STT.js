const express = require('express');
const sttRouter = express.Router();
const gClient = require('@google-cloud/speech');

sttRouter.post('/', async function(req, res)
{
    let client = new gClient.SpeechClient();
    let audioRCVD = req.body;
    let audioBytes = audioRCVD.audio;
    let audio = {content : audioBytes};
    const config = {
        sampleRateHertz: 16000,
        languageCode: 'it-IT',
        model: 'command_and_search'
    };
    const request = {
        audio: audio,
        config: config,
    };
    const [response] = await client.recognize(request).catch((err) => {console.log(err)});
    const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
    let transcriptToSend = {"transcription" : transcription};
    res.send(transcriptToSend);
})



module.exports = sttRouter;