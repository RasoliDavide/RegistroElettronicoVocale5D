const express = require('express');
const profRouter = express.Router();

let checkAuthorization = function(req, res, next)
{
    let inputKey = req.get('authorization');//recupero il codice di autorizzazione dall'header
    let verifiedKey = 1;
    //0 = no key, 1 = wrong key, 2 = correct key

    if(inputKey != undefined && inputKey != "")
    {
        for(let i = 0; ((i < authorizedKey.length)); i++)
        {
            if(authorizedKey[i].securedKey == inputKey)
            {
                verifiedKey = 2;
                break;
            }
        }
    }
    else
    {
        verifiedKey = 0;
    }
    switch(verifiedKey)
    {
        case(0):
            console.log('Auth key not found');
            res.status(401).send('Auth key not found');
            break;
        case(1):
            console.log('Wrong auth key');
            res.status(401).send('Wrong auth key');
            break;
        case(2):
            next();
            break;
    }
}

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
                    resolve(result.recordset);
                }
                )
            })
        });
    })

    let reutrnedObject = await dbQuery;

    for(let i = 0; i < reutrnedObject.length; i++)
        delete reutrnedObject[i].CFProfessore;

    return reutrnedObject;
}

profRouter.get('/getTeachingClasses', checkAuthorization, async function(req, res)
{
    let result = await getTeachingClasses(req.query.cfProfessore);
    res.send(result);
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