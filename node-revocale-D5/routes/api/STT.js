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
        //encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'it-IT'
    };
    const request = {
        audio: audio,
        config: config,
    };
    const [response] = await client.recognize(request).catch((err) => {console.log(err)});
    const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
    console.log(JSON.stringify(response));
    console.log(`Transcription: ${transcription}`);
    res.send('Vivianina')
})



module.exports = sttRouter;