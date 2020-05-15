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
            preparedStatement.input('cfStudente', dbConnection.Char(16));
            preparedStatement.input('cfProfessore', dbConnection.Char(16));
            preparedStatement.input('tipo', dbConnection.Char(1));
            preparedStatement.input('dataAssenza', dbConnection.Date());
            preparedStatement.input('concorre', dbConnection.Bit());
            if(assenza.tipo == 'A')
            {
                query = 'INSERT INTO Assenza (cfStudente, cfProfessore, tipo, dataAssenza, concorre) VALUES (@cfStudente, @cfProfessore, @tipo, @dataAssenza, @concorre)';
            }
            else
            {
                preparedStatement.input('ora', dbConnection.VarChar(5));
                query = 'INSERT INTO Assenza (cfStudente, cfProfessore, tipo, dataAssenza, concorre, ora) VALUES (@cfStudente, @cfProfessore, @tipo, @dataAssenza, @concorre, @ora)';
            }
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);
                //console.log(assenza)
                preparedStatement.execute({'cfStudente' : assenza.cfStudente, 
                                           'cfProfessore' : assenza.cfProfessore,
                                           'tipo' : assenza.tipo,
                                           'dataAssenza' : assenza.dataAssenza,
                                           'concorre' : assenza.concorre,
                                           'ora' : assenza.ora},
                
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
    //tipo, dataAssenza, concorre, ora, cfProfessore, usernameStudente
    let assenza = req.body;
    
    let allParameterReceived = (assenza.tipo && assenza.dataAssenza && assenza.concorre && assenza.cfProfessore && assenza.usernameStudente);
    
    let assenzaOK = false;
    if(allParameterReceived)
        assenzaOK  = ((assenza.tipo == 'A' && (assenza.ora == undefined || assenza.ora == "")) ||  ((assenza.tipo == 'E' || assenza.tipo == 'U') && (assenza.ora || assenza.ora != "")));
    
    let cfStudente;
    if(allParameterReceived && assenzaOK)
        cfStudente = await RECommonFunctions.getCFStudenteByUsername(assenza.usernameStudente);
    
    let result;
    if(allParameterReceived && assenzaOK && cfStudente != undefined)
    {
        delete assenza.usernameStudente;
        assenza['cfStudente'] = cfStudente;
        result = await inserisciAssenza(assenza);
    }
    console.log("130", result)
    if(!allParameterReceived)
        res.status(400).send({success : false, message : "Missing parameter(s)"});
    else if(!assenzaOK)
        res.status(400).send({success : false, message : "Tipo di assenza e ora non compatibili"});
    else if(!cfStudente)
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
            preparedStatement.input('cfStudente', dbConnection.Char(16));
            preparedStatement.input('tipo', dbConnection.Char(1));
            preparedStatement.input('dataAssenza', dbConnection.Date());
            preparedStatement.input('motivazione', dbConnection.VarChar(200));
            let query = 'UPDATE Assenza SET motivazione = @motivazione WHERE cfStudente = @cfStudente AND tipo = @tipo AND dataAssenza = @dataAssenza';
            
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({'cfStudente' : giustifica.cfStudente, 
                                           'tipo' : giustifica.tipo,
                                           'dataAssenza' : giustifica.dataAssenza,
                                           'motivazione' : giustifica.motivazione,
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
    //usernameStudente, tipo, dataAssenza, motivazione
    let giustifica = req.body;
    let result;

    let allParameterReceived = (giustifica.tipo && giustifica.dataAssenza && giustifica.motivazione && giustifica.usernameStudente);
    
    motivazioneOK = false;
    if(allParameterReceived)
        motivazioneOK = (giustifica.motivazione && giustifica.motivazione != "");
    
    let cfStudente;
    if(allParameterReceived && motivazioneOK)
        cfStudente = await RECommonFunctions.getCFStudenteByUsername(giustifica.usernameStudente);
    
    if(allParameterReceived && cfStudente != undefined)
    {
        delete giustifica.usernameStudente;
        giustifica['cfStudente'] = cfStudente;
        result = await giustificaAssenza(giustifica);
    }

    if(!allParameterReceived)
        res.status(400).send({success : false, message : "Missing parameter(s)"});
    else if(!motivazioneOK)
        res.status(400).send({success : false, message : "Motivazione vuota"});
    else if(!cfStudente)
        res.status(404).send({success : false, message : "Username dello studente non trovato nel database"});
    else if(!result.success)
        res.status(500).send(result);
    else
        res.status(201).send(result);
})

let getAssenzaByStudente = async function(cfStudente)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);

            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('cfStudente', dbConnection.Char(16));
            let query = 'SELECT * FROM Assenza WHERE cfStudente = @cfStudente';
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({'cfStudente' : cfStudente},
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
    let allParameterReceived = (req.query.usernameStudente != undefined);
    let usernameStudente;
    let usernameStudenteOK = false;
    if(allParameterReceived)
    {
        usernameStudente = req.query.usernameStudente;
        usernameStudenteOK = (usernameStudente.length == 5);
    }
        
    
    let cfStudente;
    if(allParameterReceived && usernameStudenteOK)
        cfStudente = await RECommonFunctions.getCFStudenteByUsername(usernameStudente);

    if(cfStudente != undefined)
        result = await getAssenzaByStudente(cfStudente);
    
    if(!allParameterReceived)
        res.status(400).send({success : false, message : "Missing parameter(s)"});
    else if(!usernameStudenteOK)
        res.status(400).send({success : false, message : "L'username inserito non ha il numero corretto di caratteri"});
    else if(!cfStudente)
        res.status(404).send({success : false, message : "Username dello studente non trovato nel database"});
    else
        res.status(200).send(result);
})

module.exports = assenzeRouter;