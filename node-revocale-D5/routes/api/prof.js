const express = require('express');
const profRouter = express.Router();

const RECommonFunctions = require('../common-functions');
checkAuthorization = (req, res, next) => {return RECommonFunctions.checkAuthorizationM(req, res, next);}

let getTeachingClasses = async function(cfProfessore)
{
    let classes;
    let dbQuery = new Promise(
    (resolve, reject) => 
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn)
            let query = 'SELECT * FROM getMaterie WHERE CFProfessore = @cfProfessore';
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('cfProfessore', dbConnection.Char(16));
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({'cfProfessore' : cfProfessore},
                (errExec, result) =>
                {
                    preparedStatement.unprepare(errUnprep => reject(errUnprep))
                    if(errExec)
                        reject(errExec);
                    resolve(result);
                })
            })
        });
    }).catch((err) => {console.log(err); return {success : false, message : "Database error: " + err}});

    let reutrnedObject = await dbQuery;
    if(reutrnedObject.recordset)
    {
        for(let i = 0; i < reutrnedObject.recordset.length; i++)
            delete reutrnedObject.recordset[i].CFProfessore;
        return {success: true, recordset : reutrnedObject.recordset};
    }
    else
    {
        return reutrnedObject;
    }
}

profRouter.get('/getTeachingClasses', checkAuthorization, async function(req, res)
{
    let result;
    let allParameterReceived = (req.query.cfProfessore != undefined);
    let cfProfessore;
    let cfProfessoreOK = false;
    if(allParameterReceived)
    {
        cfProfessore = req.query.cfProfessore;
        cfProfessoreOK = (cfProfessore.length == 16);
    }

    if(allParameterReceived && cfProfessoreOK)
        result = await getTeachingClasses(cfProfessore);
    
    if(!allParameterReceived)
        res.status(400).send({success : false, message : "Missing parameter(s)"});
    else if(!cfProfessoreOK)
        res.status(400).send({success : false, message : "Il codice fiscale inserito non ha il numero corretto di caratteri"});
    else if(!result.success)
        res.status(500).send(result);
    else if(result.success && result.recordset.length < 1)
        res.status(404).send({success : false, message : "Nessuna classe associata al codice fiscale inserito"}); 
    else
        res.status(200).send(result.recordset);
})

let getStudentiByClasse = async function(codiceClasse)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);

            let query = 'SELECT * FROM getStudentiByClasse WHERE CodiceClasse = @codiceClasse';
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('codiceClasse', dbConnection.VarChar(7));
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({'codiceClasse' : codiceClasse},
                (errExec, result) =>
                {
                    preparedStatement.unprepare(errUnprep => reject(errUnprep))
                    if(errExec)
                        reject(errExec);

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

profRouter.get('/getStudentiByClasse', checkAuthorization, async function(req, res)
{
    let allParameterReceived = (req.query.codiceClasse != undefined);
    let result;
    if(allParameterReceived)
        result = await getStudentiByClasse(req.query.codiceClasse);

    if(!allParameterReceived)
        res.status(400).send({success : false, message : "Missing parameter(s)"});
    else if(!result.success)
        res.status(500).send(result);
    else
        res.send(result.recordset);
})

let inserisciFirma = async function(firma)
{
    let query;
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CodiceClasse', dbConnection.VarChar(7));
            preparedStatement.input('CFProfessore', dbConnection.Char(16));
            preparedStatement.input('Ora', dbConnection.TinyInt());
            preparedStatement.input('DataFirma', dbConnection.Date());
            preparedStatement.input('Argomento', dbConnection.VarChar(500));
            preparedStatement.input('CodiceMateria', dbConnection.Int());
            
            if(firma.CompitiAssegnati)
            {
                preparedStatement.input('CompitiAssegnati', dbConnection.VarChar(500));
                query = 'INSERT INTO Firma (CFProfessore, CodiceClasse, DataFirma, Ora, Argomento, CompitiAssegnati, CodiceMateria) VALUES (@CFProfessore, @CodiceClasse, @DataFirma, @Ora, @Argomento, @CompitiAssegnati, @CodiceMateria)';
            }
            else
            {
                query = 'INSERT INTO Firma (CFProfessore, CodiceClasse, DataFirma, Ora, Argomento, CodiceMateria) VALUES (@CFProfessore, @CodiceClasse, @DataFirma, @Ora, @Argomento, @CodiceMateria)';
            }
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);
                preparedStatement.execute({'CFProfessore' : firma.CFProfessore,
                                           'CodiceClasse' : firma.CodiceClasse,
                                           'DataFirma' : firma.DataFirma,
                                           'Ora' : firma.Ora,
                                           'Argomento' : firma.Argomento,
                                           'CompitiAssegnati' : firma.CompitiAssegnati,
                                           'CodiceMateria' : firma.CodiceMateria},
                
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

profRouter.post('/firma', checkAuthorization, async function(req, res)
{
    //CFProfessore, CodiceClasse, DataFirma, Ora, Argomento, CompitiAssegnati, CodiceMateria
    let firma = req.body;
    let allParameterReceived = (firma.CFProfessore && firma.CodiceClasse && firma.DataFirma && firma.Ora && firma.Argomento && firma.CodiceMateria);
    let cfProfessoreOK;
    if(allParameterReceived)
        cfProfessoreOK = (firma.CFProfessore.length == 16);
    
    let oraOK;
    if(allParameterReceived && cfProfessoreOK)
        oraOK = (firma.Ora >= 1 && firma.Ora <= 7);

    if(firma.CompitiAssegnati == "")
        firma.CompitiAssegnati = undefined;

    let result;
    if(allParameterReceived && cfProfessoreOK && oraOK)
        result = await inserisciFirma(firma);
    
    if(!allParameterReceived)
        res.status(400).send({success : false, message : "Missing parameter(s)"});
    else if(!cfProfessoreOK)
        res.status(400).send({success : false, message : "Il codice fiscale inserito non ha il numero corretto di caratteri"});
    else if(!oraOK)
        res.status(400).send({success : false, message : "Ora inserita fuori dal range"});
    else if(!result.success)
        res.status(500).send(result);
    else
        res.status(201).send(result);
});

let getFirme = async function(cfProfessore)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);

            let query = 'SELECT * FROM getFirme WHERE CFProfessore = @CFProfessore';
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFProfessore', dbConnection.Char(16));
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({'CFProfessore' : cfProfessore},
                (errExec, result) =>
                {
                    preparedStatement.unprepare(errUnprep => reject(errUnprep))
                    if(errExec)
                        reject(errExec);

                    resolve(result);
                })
            })
        });
    }).catch((err) => {console.log(err); return {success : false, message : "Database error: " + err}});
    let reutrnedObject = await dbQuery;

    if(reutrnedObject.recordset)
        return {success: true, recordSet : reutrnedObject.recordset};
    else
        return reutrnedObject;
}

profRouter.get('/getFirme', checkAuthorization, async function(req, res)
{
    var loggedIn = authorizedKey.find((key) => {
        return key.securedKey == req.get('authorization');
    });
    
    var cfProfessore = loggedIn.cfProf;

    if(cfProfessore)
        result = await getFirme(cfProfessore);
        
    if (loggedIn == undefined)
        res.status(404).send({ success: false, message: "Login not found" });
    else if (!result.success)
        res.status(500).send(result);
    else
        res.send(result);
})
module.exports = profRouter;