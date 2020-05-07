const express = require('express');
const angularRouter = express.Router();
const dbConnection = require('mssql');

const config = {
    user: '4dd_20', //Vostro user name
    password: 'xxx123##', //Vostra password
    server: "213.140.22.237", //Stringa di connessione
    database: 'REVocale-5D', //(Nome del DB)
}


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
                }
                )
            }
        )
        })
    });
    returnedCF = passwordQueryCheck;
    return returnedCF;
}
let checkLogin = async function(inputUsername, inputPassword)
{
    let queryResult = await checkProfPasswd(inputUsername, inputPassword);
    delete inputUsername;
    delete inputPassword;
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
        reutrnedObject = {success : false};
    else
        reutrnedObject['success'] = true;

    return reutrnedObject;
}

angularRouter.post('/login', checkPostPayloadMiddleware, async function(req, res)
{
    let result = await checkLogin(req.body.username, req.body.password);
    res.send(result);
})

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
                    console.log(err);

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
        delete reutrnedObject[0].CFProfessore;

    return reutrnedObject;
}

angularRouter.get('/getTeachingClasses', async function(req, res)
{
    let result = await getTeachingClasses(req.query.cfProfessore);
    res.send(result);
})


module.exports = angularRouter;