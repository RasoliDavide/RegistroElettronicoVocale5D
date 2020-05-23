const express = require('express');
const noteRouter = express.Router();

const RECommonFunctions = require('../common-functions');
checkAuthorization = (req, res, next) => { return RECommonFunctions.checkAuthorizationM(req, res, next); }

let inserisciNota = async function (nota) {
    let query;
    let dbQuery = new Promise(
        (resolve, reject) => {
            dbConnection.connect(config, async function (errConn) {
                if (errConn)
                    reject(errConn);
                try {
                    let transaction = new dbConnection.Transaction();
                    transaction.begin(async function (errBegin) {
                        if (errBegin)
                            reject(errBegin);
                        //Prima parte: inserimento nota.
                        let continua = false;
                        let preparedStatementNota = new dbConnection.PreparedStatement(transaction);
                        preparedStatementNota.input('Tipologia', dbConnection.Bit());
                        preparedStatementNota.input('Testo', dbConnection.VarChar(400));
                        preparedStatementNota.input('TipoPenalita', dbConnection.TinyInt());
                        preparedStatementNota.input('CFProfessore', dbConnection.Char(16));
                        preparedStatementNota.input('DataNota', dbConnection.Date());
                        if (nota.Tipologia == 0) {
                            query = 'INSERT INTO nota (Tipologia, Testo, TipoPenalita, CFProfessore, DataNota) VALUES (@Tipologia, @Testo, @TipoPenalita, @CFProfessore, @DataNota)';
                            await preparedStatementNota.prepare(query).catch((error) => reject(error));
                            let resultNota = await preparedStatementNota.execute({
                                'Tipologia': nota.Tipologia,
                                'Testo': nota.Testo,
                                'TipoPenalita': nota.TipoPenalita,
                                'CFProfessore': nota.CFProfessore,
                                'DataNota': nota.DataNota
                            }).catch((error) => { reject(error) });

                            if (resultNota) {
                                if (resultNota.rowsAffected[0] == 1)
                                    continua = true;
                                else
                                    continua = false;
                            }

                            await preparedStatementNota.unprepare().catch((error) => reject(error));

                            if (!continua) {
                                await transaction.rollback().catch((error) => reject(error));
                                errRollback = new Error("Non continua");
                                reject(errRollback);
                            }
                            //Seconda parte: recupero il codice della nota appena inserita perchè è autoincrementante sul database
                            let numeroNota;
                            query = 'SELECT MAX(CodiceNota) AS CodiceNota FROM Nota';

                            let requestNumero = new dbConnection.Request(transaction);
                            let requestNota = await requestNumero.query(query).catch((error) => { console.log(error); reject(error) });
                            console.log(requestNota)
                            if (requestNota) {
                                numeroNota = requestNota.recordset[0].CodiceNota;
                            }
                            else {
                                await transaction.rollback().catch((error) => reject(error));
                                let errRollback = new Error("Problema durante il recupero del numero circolare");
                                reject(errRollback);
                            }
                            if (!numeroNota) {
                                await transaction.rollback().catch((error) => reject(error));
                                errRollback = new Error("No numero nota");
                                reject(errRollback);
                            }
                            //Terza parte: inserisco i destinatari della nota        
                            let preparedStatementDestNota = new dbConnection.PreparedStatement(transaction);
                            query = 'INSERT INTO PrendeNota (CFStudente, CodiceNota) VALUES (@CFStudente, @CodiceNota)'
                            preparedStatementDestNota.input('CFStudente', dbConnection.Char(16));
                            preparedStatementDestNota.input('CodiceNota', dbConnection.Int());
                            await preparedStatementDestNota.prepare(query).catch((error) => reject(error));
                            let resultDest;
                            for (let i = 0; i < nota.Destinatari.length; i++) {
                                resultDest = await preparedStatementDestNota.execute({
                                    'CFStudente': nota.Destinatari[i],
                                    'CodiceNota': numeroNota
                                }).catch((error) => reject(error));
                                if (resultDest.rowsAffected == 1)
                                    continua = true;
                                else {
                                    await preparedStatementDestNota.unprepare().catch((error) => reject(error));
                                    await transaction.rollback().catch((error) => reject(error));
                                    let errRollback = new Error('Errore durante l\'inserimento destinatari');
                                    reject(errRollback);
                                }
                            }
                            if (continua) {
                                await preparedStatementDestNota.unprepare().catch((error) => reject(error));
                                await transaction.commit().catch((error) => reject(error));
                                resolve({ success: true })
                            }
                        } else {
                            preparedStatementNota.input('CodiceClasse', dbConnection.VarChar(7));
                            query = 'INSERT INTO nota (Tipologia, Testo, TipoPenalita, CFProfessore, CodiceClasse, DataNota) VALUES (@Tipologia, @Testo, @TipoPenalita, @CFProfessore, @CodiceClasse, @DataNota)';
                            await preparedStatementNota.prepare(query).catch((error) => reject(error));
                            let resultNota = await preparedStatementNota.execute({
                                'Tipologia': nota.Tipologia,
                                'Testo': nota.Testo,
                                'TipoPenalita': nota.TipoPenalita,
                                'CFProfessore': nota.CFProfessore,
                                'CodiceClasse': nota.CodiceClasse,
                                'DataNota': nota.DataNota
                            }).catch((error) => reject(error));

                            if (resultNota) {
                                if (resultNota.rowsAffected[0] == 1)
                                    continua = true;
                                else
                                    continua = false;
                            }

                            await preparedStatementNota.unprepare().catch((error) => reject(error));
                            if (continua) {
                                await transaction.commit().catch((error) => reject(error));
                                resolve({ success: true });
                            }
                            else {
                                await transaction.rollback().catch((error) => reject(error));
                                let errRollback = new Error('Errore durante l\'inserimento destinatari');
                                reject(errRollback);
                            }

                        }

                    });
                } catch (err) {
                    reject(err);
                }
            });
        }).catch((err) => { console.log(err); return { success: false, message: "Database error: " + err } });

    let queryResult = await dbQuery;
    if (queryResult.success)
        return queryResult
    else if (!queryResult.success)
        return { success: false, message: "No row affected" }
}

noteRouter.post('/inserisciNota', checkAuthorization, async function (req, res) {
    let nota = req.body;
    console.log(nota);
    let allParameterReceived = (nota.Tipologia != undefined && nota.Testo && nota.TipoPenalita != undefined && nota.CFProfessore);

    let tipologiaOK, testoOK, tipoPenalitaOK, cfProfessoreOK, codiceClasseOK, coerenzaOK, allParameterOK, destOK = true;

    if (allParameterReceived) {
        tipologiaOK = (nota.Tipologia == 0 || nota.Tipologia == 1);
        testoOK = (nota.Testo != "" && nota.Testo.length < 400);
        tipoPenalitaOK = (nota.TipoPenalita >= 0 && nota.TipoPenalita <= 2);
        cfProfessoreOK = (nota.CFProfessore.length == 16);

        coerenzaOK = ((((nota.CodiceClasse == undefined || nota.CodiceClasse == "") && (nota.Destinatari.length > 0)) && nota.Tipologia == 0) || (((nota.CodiceClasse != undefined || nota.CodiceClasse != "") && (nota.Destinatari == undefined)) && nota.Tipologia == 1));

        if (nota.Tipologia == 0) {
            for (let i = 0; i < nota.Destinatari.length; i++)
                if (nota.Destinatari[i].length != 5)
                    destOK = false;
        }
        else {
            destOK = (nota.CodiceClasse.length <= 7);
        }


        allParameterOK = (testoOK && tipoPenalitaOK && cfProfessoreOK && coerenzaOK && destOK);
    }

    let result;
    if (allParameterOK) {
        if (nota.Tipologia == 0) {
            let cfStudenti = await RECommonFunctions.getCFStudenteByUsernameArray(nota.Destinatari);
            nota.Destinatari = cfStudenti;
        }
        result = await inserisciNota(nota);
    }
    if (!allParameterReceived)
        res.status(400).send({ success: false, message: "Missing parameter(s)" });
    else if (!tipologiaOK)
        res.status(400).send({ success: false, message: "Tipologia non valida" });
    else if (!testoOK)
        res.status(400).send({ success: false, message: "Testo non valido" });
    else if (!coerenzaOK)
        res.status(400).send({ success: false, message: "Tipologia nota e destinatari inseriti non coerenti" });
    else if (!destOK)
        res.status(400).send({ success: false, message: "Errore durante la lettura dei destinatari" });
    else if (!cfProfessoreOK)
        res.status(400).send({ success: false, message: "Codice fiscale professore non valido"});
    else if (!result.success)
        res.status(500).send(result);
    else
        res.status(201).send(result);
});

let getNoteByStudente = async function(cfProfessore, cfStudente)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(err) {
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            preparedStatement.input('CFProfessore', dbConnection.Char(16));
            let query = 'SELECT * FROM getNoteByStudente WHERE CFStudente = @CFStudente AND CFProfessore = @CFProfessore';
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({'CFStudente' : cfStudente,
                                           'CFProfessore' : cfProfessore},
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
    {
        for(let i = 0; i < reutrnedObject.recordset; i++)
            delete reutrnedObject.recordset[i].CFStudente
        return {success: true, recordset : reutrnedObject.recordset};
    }
    else
        return reutrnedObject;
}

noteRouter.get('/getNoteByStudente', checkAuthorization, async function(req, res)
{
    var loggedIn = authorizedKey.find((key) => {
        return key.securedKey == req.get('authorization');
    });
    let cfProfessore = loggedIn.cfProf;
    let usernameStudente = req.query.usernameStudente;
    let cfStudente;
    if(usernameStudente != undefined)
        cfStudente = await RECommonFunctions.getCFStudenteByUsername(usernameStudente);
    
    let result;
    if(cfStudente != undefined && cfProfessore != undefined)
        result = await getNoteByStudente(cfProfessore, cfStudente)
    if (!usernameStudente)
        res.status(400).send({ success: false, message: "Missing parameter(s)"});
    else if (!cfProfessore)
        res.status(404).send({ success: false, message: "CF del professore non valido"});
    else if (!cfStudente)
        res.status(404).send({ success: false, message: "Username dello studente non valido"});
    else if (!result.success)
        res.status(500).send(result);
    else
        res.status(200).send(result);
 })

 let getNoteByClasse = async function(codiceClasse, cfProfessore)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(err) {
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CodiceClasse', dbConnection.VarChar(7));
            preparedStatement.input('CFProfessore', dbConnection.Char(16));
            console.log(codiceClasse, cfProfessore)
            let query = 'SELECT * FROM Nota WHERE CodiceClasse = @CodiceClasse AND CFProfessore = @CFProfessore';
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({'CFProfessore' : cfProfessore,
                                           'CodiceClasse' : codiceClasse},
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
    {
        for(let i = 0; i < reutrnedObject.recordset; i++)
            delete reutrnedObject.recordset[i].CFStudente
        return {success: true, recordset : reutrnedObject.recordset};
    }
    else
        return reutrnedObject;
}

noteRouter.get('/getNoteByClasse', checkAuthorization, async function(req, res)
{
    var loggedIn = authorizedKey.find((key) => {
        return key.securedKey == req.get('authorization');
    });
    let cfProfessore = loggedIn.cfProf;
    let codiceClasse = req.query.codiceClasse;
    let result;
    if(codiceClasse != undefined && cfProfessore != undefined)
        result = await getNoteByClasse(codiceClasse, cfProfessore);
    if (!codiceClasse)
        res.status(400).send({ success: false, message: "Missing parameter(s)"});
    else if (!cfProfessore)
        res.status(404).send({ success: false, message: "CF del professore non valido"});
    else if (!result.success)
        res.status(500).send(result);
    else
        res.status(200).send(result);
 })
module.exports = noteRouter;