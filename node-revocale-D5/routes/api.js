const express = require('express');
const apiRouter = express.Router();
const sha512 = require('js-sha512');
const randomint = require('random-int');

const apiProf = require('./api/prof');
const apiAssenze = require('./api/assenze');
const apiVoti = require('./api/voti')

apiRouter.use('/prof', apiProf);
apiRouter.use('/assenze', apiAssenze);
apiRouter.use('/voti', apiVoti);


authorizedKey = 
[
    {
            'cfProf' : "dsa",
            'securedKey' : "all"
    }
];

apiRouter.post('/*', function(req, res, next)
{
    console.log("Forwarded");
    next();
})

const checkPostPayloadMiddleware = (req, res, next) =>
{
    if(req.body)
        next();
    else
        res.status(403).send({message : 'Missing Payload'});
}

let checkProfPasswd = async function(inputUsername, inputPassword)
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
            let query = 'SELECT CFProfessore FROM CheckPasswordProfessori WHERE Username = @username AND PassWd = @password';
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
    let queryResult = await checkProfPasswd(inputUsername, inputPassword);
    let reutrnedObject = undefined;
    if(queryResult != undefined)
    {
        let dbQuery = new Promise((resolve, reject) => 
        {
            dbConnection.connect(config, function(err) {
                let query = 'SELECT * FROM DatiProfessore WHERE CFPersona = @cfPersona';
                let preparedStatement = new dbConnection.PreparedStatement();
                preparedStatement.input('cfPersona', dbConnection.Char(16));
                preparedStatement.prepare(query,
                    err => 
                    {
                        if(err)
                            reject(err);
                        preparedStatement.execute({'cfPersona' : queryResult.CFProfessore},
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
            'cfProf' : reutrnedObject.CFPersona,
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

getCFStudenteByUsername = async function(username)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(err) {
            let query = 'SELECT CFPersona FROM Persona WHERE Username = @username';
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('username', dbConnection.VarChar(5));
            preparedStatement.prepare(query,
            err => 
            {
                if(err)
                    console.log(err);

                preparedStatement.execute({'username' : username},
                (err, result) =>
                {
                
                    preparedStatement.unprepare(
                        err => reject(err)
                    )
                    console.log(result.recordset.length);
                    if(result.recordset.length == 1)
                        resolve(result.recordset[0].CFPersona);
                    else
                    {
                        let err = new Error("No CF found with the Username inserted");
                        reject(err);
                    }
                        
                })
            })
        });
    }).catch((err) => {return undefined})
    let queryResult = await dbQuery;
    return queryResult;
}

apiRouter.post('/logout', checkAuthorization, function(req, res)
{
    for(let i = 0; i < authorizedKey.length; i++)
    {
        if(authorizedKey[i].securedKey = req.get('authorization'))
        {
            authorizedKey.splice(i, 1);
            break;
        }
    }
    console.log(authorizedKey)
    res.send('logged out');
})

module.exports = apiRouter;