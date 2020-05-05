const express = require('express');
const angularRouter = express.Router();
const session = require('express-session');
const dbConnection = require('mssql');

const config = {
    user: '4dd_20', //Vostro user name
    password: 'xxx123##', //Vostra password
    server: "213.140.22.237", //Stringa di connessione
    database: '4dd_20', //(Nome del DB)
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

let checkLogin = async function(username, password)
{
    let dbQuery = new Promise((resolve, reject) => {
        dbConnection.connect(config, function(err) {
            if (err) 
                reject(err);
        
            var request = new dbConnection.Request(); 
            request.query("select * from [dbo].[cr-unit-attributes]", function(err, result) { 
                if (err) {
                    reject(err);
                }
                resolve(result.recordset)
            });
        });
    });
    return await dbQuery;
}

angularRouter.post('/login', checkPayloadMiddleware, function(req, res)
{
    res.send(checkLogin(req.body.username, req.body.password));
})

module.exports = angularRouter;