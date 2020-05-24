var express = require('express');
var router = express.Router();
const dbConnection = require('mssql');
var createError = require('http-errors');

const checkPostPayloadMiddleware = (req, res, next) =>
{
    if(req.body)
        next();
    else
        res.status(403).send({message : 'Missing Payload'});
}

let checkStudPasswd = async function(inputUsername, inputPassword)
{
    let passwordQueryCheck = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(err) {
            if (err) 
                reject(err);
            
            var preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('username', dbConnection.Char(5));
            preparedStatement.input('password', dbConnection.Char(128));
            let query = 'select * from Persona as P join Studente as S on P.CFPersona = S.CFStudente';
            preparedStatement.prepare(query,
            err => 
            {
                if(err)
                    reject(err);
                
                    
                                
                preparedStatement.execute({'username' : inputUsername, 'password': inputPassword},
                (err, result) =>
                {
                    preparedStatement.unprepare(
                        err => reject(err)
                    )

                    resolve(result.recordset[0]);
                })
            }
        )})
    });
    returnedCF = passwordQueryCheck;
    return returnedCF;
}

let checkLogin = async function(inputUsername, inputPassword)
{
    let queryResult = await checkStudPasswd(inputUsername, inputPassword);
    let reutrnedObject = undefined;
    if(queryResult != undefined)
    {
        let dbQuery = new Promise((resolve, reject) => 
        {
            dbConnection.connect(config, function(err) {
                let query = 'SELECT * FROM DatiStudente WHERE CFPersona = @cfPersona';
                let preparedStatement = new dbConnection.PreparedStatement();
                preparedStatement.input('cfPersona', dbConnection.Char(16));
                preparedStatement.prepare(query,
                    err => 
                    {
                        if(err)
                            reject(err);
                        preparedStatement.execute({'cfPersona' : queryResult.CFStudente},
                            (err, result) =>
                            {
                                preparedStatement.unprepare(
                                    err => reject(err)
                                )
                                resolve(result.recordset[0]);
                            }
                        )
                    }
                )
            });
        });
        reutrnedObject = await dbQuery;
    }
    if(reutrnedObject == undefined)
    {
        reutrnedObject = {success : false};
    }
    else
    {
        reutrnedObject['success'] = true;
        let securedKey = sha512(inputUsername.concat(randomint(5000)));
        reutrnedObject['securedKey'] = securedKey;
        let corrispondenza = 
        {
            'cfStudente' : reutrnedObject.CFPersona,
            'securedKey' : securedKey
        }
        authorizedKey.push(corrispondenza);
    }
    return reutrnedObject;
}

apiRouter.post('/login', checkPostPayloadMiddleware, async function(req, res)
{
    let result = await checkLogin(req.body.username, req.body.password);
    res.send(result);
})



module.exports = router;