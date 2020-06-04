const express = require('express');
const sttRouter = express.Router();
const gClient = require('@google-cloud/speech');
const RECommonFunctions = require('./common-functions');
checkAuthorization = (req, res, next) => {return RECommonFunctions.checkAuthorizationM(req, res, next);}

sttRouter.post('/', checkAuthorization, async function(req, res)
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

let getUsernameByStudente = async function(nome, cognome)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(err) {
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('Nome', dbConnection.VarChar(30));
            preparedStatement.input('Cognome', dbConnection.VarChar(30));
            let query = 'SELECT * FROM getUsernameByStudente WHERE Nome = @Nome AND Cognome = @Cognome';
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({'Nome' : nome,
                                           'Cognome' : cognome},
                (errExec, result) =>
                {                
                    if(errExec)
                        reject(errExec);

                    preparedStatement.unprepare(
                        errUnprep => reject(errUnprep)
                    )
                    resolve(result);
                })
            })
        });
    }).catch((err) => {console.log(err); return {success : false, message : "Database error: " + err}});

    let reutrnedObject = await dbQuery;
    if(reutrnedObject.recordset)
        return {success: true, recordset : reutrnedObject.recordset};
    else
        return reutrnedObject;
}

sttRouter.get('/getUsernameByStudente', checkAuthorization, async function(req, res)
{
    let nome = req.query.Nome, cognome = req.query.Cognome;
    let allParameterReceived = (nome && cognome);
    let allParameterOK;
    if(allParameterReceived)
        allParameterOK = (nome.length <= 30 && cognome.length < 30);

    let result;
    if(allParameterOK)
        result = await getUsernameByStudente(nome, cognome);

    if (!allParameterReceived)
        res.status(400).send({ success: false, message: "Missing parameter(s)"});
    else if (!allParameterOK)
        res.status(400).send({ success: false, message: "Lunghezza dei parametri non conforme"});
    else if (!result.success)
        res.status(500).send(result);
    else
        res.status(200).send(result);
})

module.exports = sttRouter;