const express = require('express');
const dirigenteRouter = express.Router();
const dbConnection = require('mssql');
const RECommonFunctions = require('../common-functions');
checkAuthorization = (req, res, next) => { return RECommonFunctions.checkAuthorizationM(req, res, next); }

let checkDirigente = async function (cfProfessore) {
    let dbQuery = new Promise(
        (resolve, reject) => {
            dbConnection.connect(config, function (errConn) {
                if (errConn)
                    reject(errConn);

                let preparedStatement = new dbConnection.PreparedStatement();
                preparedStatement.input('CFProfessore', dbConnection.Char(16));
                let query = 'SELECT CFProfessore FROM Professore WHERE CFProfessore = @CFProfessore AND DIRIGENTE = 1';
                preparedStatement.prepare(query,
                    errPrep => {
                        if (errPrep)
                            reject(errPrep);

                        preparedStatement.execute({ 'CFProfessore': cfProfessore },
                            (errExec, result) => {
                                if (errExec)
                                    reject(errExec);

                                preparedStatement.unprepare(
                                    errUnprep => reject(errUnprep)
                                )
                                resolve(result.recordset);
                            })
                    })
            });
        });
    let queryResult = await dbQuery;
    console.log(queryResult, queryResult.length);
    if (queryResult.length == 1)
        return true;
    else
        return false;
}

let inserisciComunicazione = async function (comunicazione) {
    let query;
    let dbQuery = new Promise(
        (resolve, reject) => {
            dbConnection.connect(config, async function (errConn) {
                if (errConn)
                    reject(errConn);

                let transaction = new dbConnection.Transaction();
                transaction.begin(async function(errBegin){
                    if (errBegin)
                        reject(errBegin);

                    let preparedStatement = new dbConnection.PreparedStatement();
                    preparedStatement.input('Titolo', dbConnection.VarChar(100));
                    preparedStatement.input('CFProfessore', dbConnection.VarChar(5000));
                    query = 'INSERT INTO Comunicazione (Titolo, Testo) VALUES (@Titolo, @Testo)';
                    let continua = false;
                    await preparedStatement.prepare(query,
                        async function(errPrep){
                            if (errPrep) {
                                transaction.rollback(errRoll => { if (errRoll) reject(errRoll) });
                                reject(errPrep);
                            }

                            await preparedStatement.execute({
                                'Titolo': comunicazione.Titolo,
                                'Testo': comunicazione.Testo
                            },

                                async function(errExec, result){
                                    if (errExec) {
                                        transaction.rollback(errRoll => { if (errRoll) reject(errRoll) });
                                        reject(errExec);
                                    }


                                    preparedStatement.unprepare(
                                        errUnprep => {
                                            transaction.rollback(err => { if (errRoll) reject(errRoll) })
                                            reject(errUnprep);
                                        }
                                    )

                                    if (result)
                                        if (result.rowsAffected == 1)
                                            continua = true;
                                        else {
                                            err = new Error("No modified values")
                                            reject(errExec);
                                        }
                                })
                        });
                    if (!continua) {
                        transaction.rollback(errRoll => {
                            reject(errRoll)
                        })
                        errCont = new Error("Non continua");
                        throw errCont;
                    }
                    preparedStatement = new dbConnection.PreparedStatement();
                    preparedStatement.input('Titolo', dbConnection.VarChar(100));
                    preparedStatement.input('CFProfessore', dbConnection.VarChar(5000));
                    query = 'SELECT CodiceCircolare FROM Comunicazione WHERE Titolo = @Titolo AND Testo = @Testo';
                    let numeroCircolare;
                    await preparedStatement.prepare(query,
                        async function(errPrep){
                            if (errPrep) {
                                transaction.rollback(errRoll => { if (errRoll) reject(errRoll) });
                                reject(errPrep);
                            }
                            await preparedStatement.execute({
                                'Titolo': comunicazione.Titolo,
                                'Testo': comunicazione.Testo
                            },

                                async function(errExec, result)
                                {
                                    if (errExec) {
                                        transaction.rollback(errRoll => { if (errRoll) reject(errRoll) });
                                        reject(errExec);
                                    }


                                    preparedStatement.unprepare(
                                        errUnprep => {
                                            transaction.rollback(err => { if (errRoll) reject(errRoll) });
                                            reject(errUnprep);
                                        }
                                    )

                                    if (result)
                                        if (result.recordset.length == 1)
                                            numeroCircolare = result.recordset[0].NumeroCircolare;
                                        else {
                                            err = new Error("No modified values");
                                            if (errExec) {
                                                transaction.rollback(errRoll => { if (errRoll) reject(errRoll) });
                                                reject(errExec);
                                            }
                                            reject(errExec);
                                        }
                                })
                        });
                    if (numeroCircolare == undefined) {
                        transaction.rollback(errRoll => {
                            if (errRoll) reject(errRoll)
                        })
                        errCont = new Error("No numero circolare");
                        throw errCont;
                    }
                    query = 'INSERT INTO DestinatariComunicazione (CodiceCircolare, CodiceClasse) VALUES (@CodiceCircolare, @CodiceCircolare)';
                    await preparedStatement.prepare(query, async function(errPrep)
                    {
                        if (errPrep) {
                            transaction.rollback(errRoll => { if (errRoll) reject(errRoll) });
                            reject(errPrep);
                        }
                        for (let destinatario of comunicazione.Destinatari) {
                            if (continua) {
                                await preparedStatement.execute({
                                    'CodiceCircolare': numeroCircolare,
                                    'CodiceCircolare': destinatario
                                },
                                    (errExec, result) => {
                                        if (errExec) {
                                            transaction.rollback(errRoll => { if (errRoll) reject(errRoll) });
                                            reject(errExec);
                                        }
                                        preparedStatement.unprepare(
                                            errUnprep => {
                                                transaction.rollback(err => { if (errRoll) reject(errRoll) });
                                                reject(errUnprep);
                                            }
                                        )
                                        if (result) {
                                            if (result.rowsAffected[0] == 1)
                                                continua = true;
                                            else {
                                                err = new Error("No modified values");
                                                if (errExec) {
                                                    transaction.rollback(errRoll => { if (errRoll) reject(errRoll) });
                                                    reject(errExec);
                                                }
                                                reject(errExec);
                                            }
                                        }
                                    })
                            }
                            else
                                break;
                        }
                        if (continua) {
                            transaction.commit((errComm) => reject(errComm));
                            resolve({ success: true });
                        }
                    })
                })
            });
        }).catch((err) => { console.log(err); return { success: false, message: "Database error: " + err } });

    let queryResult = await dbQuery;
    if (queryResult.success)
        return queryResult
    else if (!queryResult.success)
        return { success: false, message: "No row affected" }

}

dirigenteRouter.post('/inserisciComunicazione', checkAuthorization, async function (req, res) {
    //Titolo, Testo, Destinatari[]
    let comunicazione = req.body;
    let allParameterReceived = (comunicazione.Titolo && comunicazione.Testo && comunicazione.Destinatari)

    let titoloOK, testoOK, destinatariOK, allParameterOK = false;
    if (allParameterReceived) {
        titoloOK = (comunicazione.Titolo.length < 100);
        testoOK = (comunicazione.Testo.length < 5000);
        destinatariOK = (comunicazione.Destinatari.length >= 1);
        allParameterOK = titoloOK && testoOK && destinatariOK;
    }


    if (allParameterOK) {

    }
})
let getAllClasses = async function () {
    let dbQuery = new Promise(
        (resolve, reject) => {
            dbConnection.connect(config, function (errConn) {
                if (errConn)
                    reject(errConn);

                let request = new dbConnection.Request();
                let query = 'SELECT * FROM [dbo].[classe]';
                request.query(query,
                    (errExec, result) => {
                        if (errExec)
                            reject(errExec);

                        if (result)
                            resolve(result.recordset);
                        else {
                            err = new Error("No modified values");
                            reject(errExec);
                        }
                    }
                )
            })
        });
    let queryResult = await dbQuery;
    if (queryResult.length > 0)
        return { success: true, recordSet: queryResult };
    else
        return { success: false };
}

dirigenteRouter.get('/getAllClasses', checkAuthorization, async function (req, res) {
    var loggedIn = authorizedKey.find((key) => {
        console.log(key)
        return key.securedKey == req.get('authorization');
    });

    let isDirigente = await checkDirigente(loggedIn.cfProf);
    let result;
    if (isDirigente)
        result = await getAllClasses();

    if (loggedIn == undefined)
        res.status(404).send({ success: false, message: "Login not found" });
    else if (!isDirigente)
        res.status(403).send({ success: false, message: "Non sei un dirigente" });
    else if (!result.success)
        res.status(500).send(result);
    else
        res.send(result);
})
module.exports = dirigenteRouter;