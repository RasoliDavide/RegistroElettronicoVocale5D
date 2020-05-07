const express = require('express');
const angularRouter = express.Router();
const session = require('express-session');
const dbConnection = require('mssql');

const config = {
    user: '4dd_20', //Vostro user name
    password: 'xxx123##', //Vostra password
    server: "213.140.22.237", //Stringa di connessione
    database: 'REVocale-5D', //(Nome del DB)
}

angularRouter.use(
    session(
        {
            secret: '51ff88fb41d23218b94f575323dcbe46a6c674a7f89ca5e55abcaac9f4fc8bb044feac1ea989917b76fe7168c2fc11602b447ab9e1ff4aad62cf38a256b2bb80',
            resave: false,
            saveUninitialized: false
        }
    )
)

const checkPayloadMiddleware = (req, res, next) =>
{
    if(req.body)
        next();
    else
        res.status(403).send({message : 'Missing Payload'});
}
let checkProfPasswd = async function()
{
    let passwordQueryCheck = new Promise(
        (resolve, reject) =>
        {
                 dbConnection.connect(config, function(err) {
                    if (err) 
                        reject(err);
                
                    var preparedStatement = new dbConnection.PreparedStatement();
                    preparedStatement.input('username', dbConnection.VarChar);
                    preparedStatement.input('password', dbConnection.Char);
                    let query = 'SELECT * FROM CheckPasswordProfessore WHERE Username = @username AND Password = @password';
                    let queryResult;
                    preparedStatement.prepare(query,
                        err => 
                        {
                            if(err)
                                reject(err);
                                
                            preparedStatement.execute({username : inputUsername, password, inputPassword},
                                (err, result) =>
                                {
                                    preparedStatement.unprepare(
                                        err => reject(err)
                                    )
                                    queryResult = result.recordset;
                                }
                            )
                        }
                    )
                }
            )
            let passwordCheckResult = await passwordCheckResult;
            console.log(queryResult);
            if(queryResult.length == 1)
            {
                let query = 'SELECT * FROM DatiProfessore WHERE CFPersona = @cfPersona';
                preparedStatement.prepare(query,
                    err => 
                    {
                        if(err)
                            reject(err);
                            
                        preparedStatement.execute({cfPersona : queryResult[0].CFPersona},
                            (err, result) =>
                            {
                                preparedStatement.unprepare(
                                    err => reject(err)
                                )
                                resolve(result.recordset);
                            }
                        )
                    }
                )
            }
        });
    });
}
let checkLogin = async function(inputUsername, inputPassword)
{
    let dbQuery = new Promise((resolve, reject) => 
    {
        dbConnection.connect(config, function(err) {
            let passwordQueryCheck = new Promise(
                (resolve, reject) =>
                {
                    if (err) 
                        reject(err);
                
                    var preparedStatement = new dbConnection.PreparedStatement();
                    preparedStatement.input('username', dbConnection.VarChar);
                    preparedStatement.input('password', dbConnection.Char);
                    let query = 'SELECT * FROM CheckPasswordProfessore WHERE Username = @username AND Password = @password';
                    let queryResult;
                    preparedStatement.prepare(query,
                        err => 
                        {
                            if(err)
                                reject(err);
                                
                            preparedStatement.execute({username : inputUsername, password, inputPassword},
                                (err, result) =>
                                {
                                    preparedStatement.unprepare(
                                        err => reject(err)
                                    )
                                    queryResult = result.recordset;
                                }
                            )
                        }
                    )
                }
            )
            let passwordCheckResult = await passwordCheckResult;
            console.log(queryResult);
            if(queryResult.length == 1)
            {
                let query = 'SELECT * FROM DatiProfessore WHERE CFPersona = @cfPersona';
                preparedStatement.prepare(query,
                    err => 
                    {
                        if(err)
                            reject(err);
                            
                        preparedStatement.execute({cfPersona : queryResult[0].CFPersona},
                            (err, result) =>
                            {
                                preparedStatement.unprepare(
                                    err => reject(err)
                                )
                                resolve(result.recordset);
                            }
                        )
                    }
                )
            }
        });
    });
    let reutrnedObject = await dbQuery;
    console.log(queryResult);
    return queryResult;
}

angularRouter.post('/login', checkPayloadMiddleware, function(req, res)
{
    console.log(req.body);
    let result = checkLogin(req.body.username, req.body.password);

    res.send();
})

module.exports = angularRouter;