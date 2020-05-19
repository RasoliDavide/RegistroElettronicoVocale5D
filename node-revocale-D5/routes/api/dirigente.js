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
                try {
                    let transaction = new dbConnection.Transaction();
                    transaction.begin(async function (errBegin) {
                        if (errBegin)
                            reject(errBegin);
                        //Prima parte: inserimento comunicazione.
                        let continua = false;
                        let preparedStatementCom = new dbConnection.PreparedStatement(transaction);
                        preparedStatementCom.input('Titolo', dbConnection.VarChar(100));
                        preparedStatementCom.input('CFProfessore', dbConnection.VarChar(5000));
                        query = 'INSERT INTO Comunicazione (Titolo, Testo) VALUES (@Titolo, @Testo)';
                        await preparedStatementCom.prepare(query);
                        let resultComunicazione = await preparedStatementCom.execute({
                            'Titolo': comunicazione.Titolo,
                            'Testo': comunicazione.Testo
                        });

                        if (resultComunicazione) {
                            if (resultComunicazione.rowsAffected == 1)
                                continua = true;
                            else
                                continua = false;
                        }
                        await preparedStatementCom.unprepare();

                        if (!continua) {
                            await transaction.rollback();
                            errRollback = new Error("Non continua");
                            reject(errRollback);
                        }
                        //Seconda parte: recupero il codice della circolare appena inserita perchè è autoincrementante sul database
                        let numeroCircolare;
                        query = 'SELECT CodiceCircolare FROM Comunicazione WHERE Titolo = @Titolo AND Testo = @Testo';

                        let preparedStatementGetNumero = new dbConnection.PreparedStatement(transaction);
                        preparedStatementGetNumero.input('Titolo', dbConnection.VarChar(100));
                        preparedStatementGetNumero.input('Testo', dbConnection.VarChar(5000));

                        await preparedStatementGetNumero.prepare(query);
                        let resultCircolare = await preparedStatementGetNumero.execute({
                            'Titolo': comunicazione.Titolo,
                            'Testo': comunicazione.Testo
                        });

                        if (resultCircolare) {
                            numeroCircolare = resultCircolare.recordset[0].CodiceCircolare;
                            await preparedStatementGetNumero.unprepare();
                        }
                        else {
                            await preparedStatementGetNumero.unprepare();
                            await transaction.rollback();
                            let errRollback = new Error("Problema durante il recupero del numero circolare");
                            reject(errRollback);
                        }

                        //Terza parte: inserisco i destinatari della circolare
                        let destinatari = comunicazione.Destinatari;
                        continua = false;
                        query = 'INSERT INTO DestinatarioComunicazione (CodiceCircolare, CodiceClasse) VALUES (@CodiceCircolare, @CodiceClasse)'
                        let preparedStatementDest = new dbConnection.PreparedStatement(transaction);
                        preparedStatementDest.input('CodiceCircolare', dbConnection.Int());
                        preparedStatementDest.input('CodiceClasse', dbConnection.VarChar(7));
                        await preparedStatementDest.prepare(query);
                        for (let i = 0; i < destinatari.length; i++) {
                            let resultDest = await preparedStatementDest.execute({
                                'CodiceCircolare': numeroCircolare,
                                'CodiceClasse': destinatari[i]
                            });
                            if (resultDest.rowsAffected == 1)
                                continua = true;
                            else
                                continua = false;

                            if (!continua) {
                                await preparedStatementDest.unprepare();
                                await transaction.rollback();
                                let errRollback = new Error('Errore durante l\'inserimento destinatari');
                                reject(errRollback);
                            }
                        }
                        if (continua) {
                            await transaction.commit();
                            resolve({ success: true })
                        }
                    });
                
                }catch(err)
                {
                    console.log("cought");
                    reject(err);
                }
        });
}).catch ((err) => { console.log(err); return { success: false, message: "Database error: " + err } });

let queryResult = await dbQuery;
if (queryResult.success)
    return queryResult
else if (!queryResult.success)
    return { success: false, message: "No row affected" }

}

dirigenteRouter.post('/inserisciComunicazione', checkAuthorization, async function (req, res) {
    //Titolo, Testo, Destinatari[]
    let comunicazione = req.body;
    console.log(comunicazione);
    let allParameterReceived = (comunicazione.Titolo && comunicazione.Testo && comunicazione.Destinatari)

    let titoloOK, testoOK, destinatariOK, allParameterOK = false;
    if (allParameterReceived) {
        titoloOK = (comunicazione.Titolo.length < 100);
        testoOK = (comunicazione.Testo.length < 5000);
        destinatariOK = (comunicazione.Destinatari.length >= 1);
        allParameterOK = titoloOK && testoOK && destinatariOK;
    }


    if (allParameterOK) {
        let result = inserisciComunicazione(comunicazione);
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