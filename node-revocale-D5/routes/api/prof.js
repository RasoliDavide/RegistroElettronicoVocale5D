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
        dbConnection.connect(config, function(err) {
            let query = 'SELECT * FROM getMaterie WHERE CFProfessore = @cfProfessore';
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('cfProfessore', dbConnection.Char(16));
            preparedStatement.prepare(query,
            err => 
            {
                if(err)
                    reject(err);

                preparedStatement.execute({'cfProfessore' : cfProfessore},
                (err, result) =>
                {
                    preparedStatement.unprepare(
                        err => reject(err)
                    )
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
    console.log(req.query.cfProfessore);
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
        dbConnection.connect(config, function(err) {
            let query = 'SELECT * FROM getStudentiByClasse WHERE CodiceClasse = @codiceClasse';
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('codiceClasse', dbConnection.VarChar(7));
            preparedStatement.prepare(query,
            err => 
            {
                if(err)
                    console.log(err);

                preparedStatement.execute({'codiceClasse' : codiceClasse},
                (err, result) =>
                {
                    preparedStatement.unprepare(
                        err => reject(err)
                    )

                    resolve(result.recordset);
                })
            })
        });
    });
    let queryResult = await dbQuery;
    for(let i = 0; i < queryResult.length; i++)
        delete queryResult[i].CodiceClasse

    return queryResult;
}

profRouter.get('/getStudentiByClasse', checkAuthorization, async function(req, res)
{
    let result = await getStudentiByClasse(req.query.codiceClasse);
    res.send(result);
})



module.exports = profRouter;