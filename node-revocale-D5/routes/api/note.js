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
                        //Prima parte: inserimento comunicazione.
                        let continua = false;
                        let preparedStatementNota = new dbConnection.PreparedStatement(transaction);
                        preparedStatementNota.input('Tipologia', dbConnection.Bit());
                        preparedStatementNota.input('Testo', dbConnection.VarChar(400));
                        preparedStatementNota.input('TipoPenalita', dbConnection.TinyInt());
                        preparedStatementNota.input('CFProfessore', dbConnection.Char(16));
                        preparedStatementNota.input('DataNota', dbConnection.Date());
                        if (nota.Tipologia == 0) {
                            query = 'INSERT INTO Comunicazione (Tipologia, Testo, TipoPenalita, CFProfessore, DataNota) VALUES (@Tipologia, @Testo, @TipoPenalita, @CFProfessore, @DataNota)';
                            await preparedStatementNota.prepare(query).catch((error) => reject(error));
                            let resultNota = await preparedStatementNota.execute({
                                'Tipologia': comunicazione.Tipologia,
                                'Testo': comunicazione.Testo,
                                'TipoPenalita': comunicazione.TipoPenalita,
                                'CFProfessore': comunicazione.CFProfessore,
                                'DataNota': comunicazione.DataNota
                            }).catch((error) => reject(error));

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
                            query = 'SELECT MAX(CodiceNota) FROM Nota';

                            let requestNumero = new dbConnection.Request(transaction);
                            let requestNota = await requestNumero.query().catch((error) => reject(error));

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
                        }else
                        {
                            preparedStatementNota.input('CodiceClasse', dbConnection.VarChar(7));
                            query = 'INSERT INTO Comunicazione (Tipologia, Testo, TipoPenalita, CFProfessore, CodiceClasse, DataNota) VALUES (@Tipologia, @Testo, @TipoPenalita, @CFProfessore, @CodiceClasse, @DataNota)';
                            await preparedStatementNota.prepare(query).catch((error) => reject(error));
                            let resultNota = await preparedStatementNota.execute({
                                'Tipologia': comunicazione.Tipologia,
                                'Testo': comunicazione.Testo,
                                'TipoPenalita': comunicazione.TipoPenalita,
                                'CFProfessore': comunicazione.CFProfessore,
                                'DataNota': comunicazione.DataNota
                            }).catch((error) => reject(error));

                            if (resultNota) {
                                if (resultNota.rowsAffected[0] == 1)
                                    continua = true;
                                else
                                    continua = false;
                            }

                            await preparedStatementNota.unprepare().catch((error) => reject(error));
                            if(continua)
                            {
                                await transaction.commit().catch((error) => reject(error));
                                resolve({success : true});
                            }
                            else
                            {
                                await transaction.rollback().catch((error) => reject(error));
                                let errRollback = new Error('Errore durante l\'inserimento destinatari');
                                reject(errRollback);
                            }
                                
                        }

                    });
                }catch (err) {
                    console.log("cought");
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

noteRouter.post('/inserisciNota', checkAuthorization, async function (res, req) {
    let nota = req.body;
    let allParameterReceived = (nota.Tipologia != undefined && nota.Testo && nota.TipoPenalita != undefined && nota.CFProfessore);

    let tipologiaOK, testoOK, tipoPenalitaOK, cfProfessoreOK, codiceClasseOK, coerenzaOK, allParameterOK;

    if (allParameterReceived) {
        tipologiaOK = (nota.Tipologia == 0 || nota.Tipologia == 1);
        testoOK = (nota.Testo != "" && nota.Testo.length < 400);
        tipoPenalitaOK = (nota.TipoPenalita >= 0 && nota.TipoPenalita <= 2);
        cfProfessoreOK = (nota.cfProfessore.length == 16);
        coerenzaOK = ((((nota.CodiceClasse == undefined || nota.CodiceClasse == "") && (nota.Destinatari.length > 0)) && nota.Tipologia == 0) || (((nota.CodiceClasse != undefined || nota.CodiceClasse != "")  && (nota.Destinatari.length == undefined)) && nota.Tipologia == 1));
        allParameterOK = (testoOK && tipoPenalitaOK && cfProfessoreOK && coerenzaOK);
    }

    let result;
    if (allParameterOK)
    {
        result = inserisciNota(nota);
    }
})