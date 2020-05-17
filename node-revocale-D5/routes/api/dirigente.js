const express = require('express');
const dirigenteRouter = express.Router();
const dbConnection = require('mssql');
const RECommonFunctions = require('../common-functions');
checkAuthorization = (req, res, next) => {return RECommonFunctions.checkAuthorizationM(req, res, next);}

let checkDirigente = async function(cfProfessore)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);

            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFProfessore', dbConnection.Char(16));
            let query = 'SELECT CFProfessore FROM Professore WHERE CFProfessore = @CFProfessore';
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({'CFProfessore' : cfProfessore},
                (errExec, result) =>
                {                
                    if(errExec)
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
    if(queryResult.length == 1)
        return true;
    else
        return false;
}

let inserisciComunicazione = async function(comunicazione)
{
    let query;
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);
            
            let transaction = new dbConnection.Transaction();
            transaction.begin(errBegin => 
            {
                if(errBegin)
                    reject(errBegin);
                
                let preparedStatement = new dbConnection.PreparedStatement();
                preparedStatement.input('Titolo', dbConnection.VarChar(100));
                preparedStatement.input('CFProfessore', dbConnection.VarChar(5000));
                query = 'INSERT INTO Comunicazione (Titolo, Testo) VALUES (@Titolo, @Testo)';
                let continua = false;
                await preparedStatement.prepare(query,
                errPrep => 
                {
                    if(errPrep)
                    {
                        transaction.rollback(errRoll => {if(errRoll) reject(errRoll)});
                        reject(errPrep);
                    }
                        
                    await preparedStatement.execute({'Titolo' : comunicazione.Titolo, 
                                            'Testo' : comunicazione.Testo},
                    
                    (errExec, result) =>
                    {      
                        if(errExec)
                        {
                            transaction.rollback(errRoll => {if(errRoll) reject(errRoll)});
                            reject(errExec);
                        }
                            

                        preparedStatement.unprepare(
                            errUnprep => 
                            {
                                transaction.rollback(err => {if(errRoll) reject(errRoll)})
                                reject(errUnprep);
                            }
                        )

                        if(result)
                            if(result.rowsAffected == 1)
                                continua = true;
                        else
                        {
                            err = new Error("No modified values")
                            reject(errExec);
                        }
                    })
                });
                if(!continua)
                {
                    transaction.rollback(errRoll => 
                    {
                        reject(errRoll)
                    })
                }
                preparedStatement = new dbConnection.PreparedStatement();
                preparedStatement.input('Titolo', dbConnection.VarChar(100));
                preparedStatement.input('CFProfessore', dbConnection.VarChar(5000));
                query = 'SELECT CodiceCircolare FROM Comunicazione WHERE Titolo = @Titolo AND Testo = @Testo';
                let numeroCircolare;
                await preparedStatement.prepare(query,
                errPrep => 
                {
                    if(errPrep)
                    {
                        transaction.rollback(errRoll => {if(errRoll) reject(errRoll)});
                        reject(errPrep);
                    }
                    await preparedStatement.execute({'Titolo' : comunicazione.Titolo, 
                                                'Testo' : comunicazione.Testo},
                    
                    (errExec, result) =>
                    {      
                        if(errExec)
                        {
                            transaction.rollback(errRoll => {if(errRoll) reject(errRoll)});
                            reject(errExec);
                        }
                            

                        preparedStatement.unprepare(
                            errUnprep => 
                            {
                                transaction.rollback(err => {if(errRoll) reject(errRoll)})
                                reject(errUnprep);
                            }
                        )

                        if(result)
                            if(result.recordset.length == 1)
                                numeroCircolare = result.recordset[0].NumeroCircolare; 
                        else
                        {
                            err = new Error("No modified values")
                            reject(errExec);
                        }
                    })
                })
            })
        });
    }).catch((err) => {console.log(err); return {success : false, message : "Database error: " + err}});

    let queryResult = await dbQuery;
    if(queryResult == 1)
    {
        
    }
    else if(queryResult == 0)
        return {success : false, message : "No row affected"}
    else
        return queryResult;
}

dirigenteRouter.post('/inserisciComunicazione', checkAuthorization, async function(req, res)
{
    //Titolo, Testo, Destinatari[]
    let comunicazione = req.body;
    let allParameterReceived = (comunicazione.Titolo && comunicazione.Testo && comunicazione.Destinatari)
    
    let titoloOK, testoOK, destinatariOK, allParameterOK = false;
    if(allParameterReceived)
    {
        titoloOK = (comunicazione.Titolo.length < 100);
        testoOK = (comunicazione.Testo.length < 5000);
        destinatariOK = (comunicazione.Destinatari.length >= 1);
        allParameterOK = titoloOK && testoOK && destinatariOK;
    }
    

    if(allParameterOK)
    {

    }
})

module.exports = dirigenteRouter;