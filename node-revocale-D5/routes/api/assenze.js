const express = require('express');
const assenzeRouter = express.Router();

const RECommonFunctions = require('../common-functions');
checkAuthorization = (req, res, next) => {return RECommonFunctions.checkAuthorizationM(req, res, next);}


let inserisciAssenza = async function(assenza)
{
    let query;
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            preparedStatement.input('CFProfessore', dbConnection.Char(16));
            preparedStatement.input('Tipo', dbConnection.Char(1));
            preparedStatement.input('DataAssenza', dbConnection.Date());
            preparedStatement.input('Concorre', dbConnection.Bit());
            if(assenza.Tipo == 'A')
            {
                query = 'INSERT INTO Assenza (CFStudente, CFProfessore, Tipo, DataAssenza, Concorre) VALUES (@CFStudente, @CFProfessore, @Tipo, @DataAssenza, @Concorre)';
            }
            else
            {
                preparedStatement.input('Ora', dbConnection.VarChar(5));
                query = 'INSERT INTO Assenza (CFStudente, CFProfessore, Tipo, DataAssenza, Concorre, Ora) VALUES (@CFStudente, @CFProfessore, @Tipo, @DataAssenza, @Concorre, @Ora)';
            }
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);
                //console.log(assenza)
                preparedStatement.execute({'CFStudente' : assenza.CFStudente, 
                                           'CFProfessore' : assenza.CFProfessore,
                                           'Tipo' : assenza.Tipo,
                                           'DataAssenza' : assenza.DataAssenza,
                                           'Concorre' : assenza.Concorre,
                                           'Ora' : assenza.Ora},
                
                (errExec, result) =>
                {      
                    if(errExec)
                        reject(errExec);

                    preparedStatement.unprepare(
                        errUnprep => reject(errUnprep)
                    )

                    if(result)
                        resolve(result.rowsAffected[0]);
                    else
                    {
                        err = new Error("No modified values")
                        reject(errExec);
                    }
                })
            })
        });
    }).catch((err) => {console.log(err); return {success : false, message : "Database error: " + err}});

    let queryResult = await dbQuery;
    if(queryResult == 1)
        return {success : true};
    else if(queryResult == 0)
        return {success : false, message : "No row affected"}
    else
        return queryResult;
}

assenzeRouter.post('/inserisciAssenza', checkAuthorization, async function(req, res)
{
    //Tipo, DataAssenza, Concorre, Ora, CFProfessore, UsernameStudente
    let assenza = req.body;
    console.log(assenza);
    let allParameterReceived = (assenza.Tipo && assenza.DataAssenza && assenza.Concorre != undefined && assenza.CFProfessore && assenza.UsernameStudente);
    
    let assenzaOK = false;
    if(allParameterReceived)
        assenzaOK  = ((assenza.Tipo == 'A' && (assenza.Ora == undefined || assenza.Ora == "")) ||  ((assenza.Tipo == 'E' || assenza.Tipo == 'U') && (assenza.Ora || assenza.Ora != "")));
    
    let CFStudente;
    if(allParameterReceived && assenzaOK)
        CFStudente = await RECommonFunctions.getCFStudenteByUsername(assenza.UsernameStudente);
    
    let result;
    if(allParameterReceived && assenzaOK && CFStudente != undefined)
    {
        delete assenza.UsernameStudente;
        assenza['CFStudente'] = CFStudente;
        result = await inserisciAssenza(assenza);
    }
    console.log("130", result)
    if(!allParameterReceived)
        res.status(400).send({success : false, message : "Missing parameter(s)"});
    else if(!assenzaOK)
        res.status(400).send({success : false, message : "Tipo di assenza e ora non compatibili"});
    else if(!CFStudente)
        res.status(404).send({success : false, message : "Username dello studente non trovato nel database"});
    else if(!result.success)
        res.status(500).send(result);
    else
        res.status(201).send(result);
})

let giustificaAssenza = async function(giustifica)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);

            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            preparedStatement.input('Tipo', dbConnection.Char(1));
            preparedStatement.input('DataAssenza', dbConnection.Date());
            preparedStatement.input('Motivazione', dbConnection.VarChar(200));
            let query = 'UPDATE Assenza SET Motivazione = @Motivazione WHERE CFStudente = @CFStudente AND Tipo = @Tipo AND DataAssenza = @DataAssenza';
            
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({'CFStudente' : giustifica.CFStudente, 
                                           'Tipo' : giustifica.Tipo,
                                           'DataAssenza' : giustifica.DataAssenza,
                                           'Motivazione' : giustifica.Motivazione,
                                        },
                (errExec, result) =>
                {              
                    if(errExec)
                        reject(errExec);
                        
                    preparedStatement.unprepare(
                        errUnprep => reject(errUnprep)
                    )
                    if(result)
                        resolve(result.rowsAffected[0]);
                    else
                    {
                        err = new Error("No modified values")
                        reject(errExec);
                    }
                })
            })
        });
    }).catch((err) => {console.log(err); return {success : false, message : "Database error: " + err}});

    let queryResult = await dbQuery;
    if(queryResult == 1)
        return {success : true};
    else if(queryResult == 0)
        return {success : false, message : "No row affected"}
    else
        return queryResult;
}

assenzeRouter.post('/giustificaAssenza', checkAuthorization, async function(req, res)
{
    //UsernameStudente, Tipo, DataAssenza, motivazione
    let giustifica = req.body;
    let result;
    console.log(giustifica)
    let allParameterReceived = (giustifica.Tipo && giustifica.DataAssenza && giustifica.Motivazione && giustifica.UsernameStudente);
    
    motivazioneOK = false;
    if(allParameterReceived)
        motivazioneOK = (giustifica.Motivazione && giustifica.Motivazione != "");
    
    let CFStudente;
    if(allParameterReceived && motivazioneOK)
        CFStudente = await RECommonFunctions.getCFStudenteByUsername(giustifica.UsernameStudente);
    
    if(allParameterReceived && CFStudente != undefined)
    {
        delete giustifica.UsernameStudente;
        giustifica['CFStudente'] = CFStudente;
        result = await giustificaAssenza(giustifica);
    }

    if(!allParameterReceived)
        res.status(400).send({success : false, message : "Missing parameter(s)"});
    else if(!motivazioneOK)
        res.status(400).send({success : false, message : "Motivazione vuota"});
    else if(!CFStudente)
        res.status(404).send({success : false, message : "Username dello studente non trovato nel database"});
    else if(!result.success)
        res.status(500).send(result);
    else
        res.status(201).send(result);
})

let getAssenzaByStudente = async function(CFStudente)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);

            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            let query = 'SELECT * FROM Assenza WHERE CFStudente = @CFStudente';
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({'CFStudente' : CFStudente},
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
    return queryResult;
}

assenzeRouter.get('/getAssenzeByStudente', checkAuthorization, async function(req, res)
{
    let result;
    let allParameterReceived = (req.query.UsernameStudente != undefined);
    let UsernameStudente;
    let UsernameStudenteOK = false;
    if(allParameterReceived)
    {
        UsernameStudente = req.query.UsernameStudente;
        UsernameStudenteOK = (UsernameStudente.length == 5);
    }
        
    
    let CFStudente;
    if(allParameterReceived && UsernameStudenteOK)
        CFStudente = await RECommonFunctions.getCFStudenteByUsername(UsernameStudente);

    if(CFStudente != undefined)
        result = await getAssenzaByStudente(CFStudente);
    
    if(!allParameterReceived)
        res.status(400).send({success : false, message : "Missing parameter(s)"});
    else if(!UsernameStudenteOK)
        res.status(400).send({success : false, message : "L'username inserito non ha il numero corretto di caratteri"});
    else if(!CFStudente)
        res.status(404).send({success : false, message : "Username dello studente non trovato nel database"});
    else
        res.status(200).send(result);
})

module.exports = assenzeRouter;