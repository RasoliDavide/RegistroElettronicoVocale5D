var express = require('express');
var resLogin = express.Router();
const dbConnection = require('mssql');
var createError = require('http-errors');
const sha512 = require('js-sha512');
const randomint = require('random-int');


let checkStudPasswd = async function(inputUsername, inputPassword)
{
    let passwordQueryCheck = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(err) {
            if (err) 
                reject(err);
            //
            var preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('Username', dbConnection.Char(5));
            preparedStatement.input('Password', dbConnection.Char(128));
            let query = 'SELECT * FROM persona WHERE Username = @Username AND PassWd = @Password';
            preparedStatement.prepare(query,
            err => 
            {
                if(err)
                    reject(err);
                
                preparedStatement.execute({'Username' : inputUsername, 'Password': inputPassword},
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
    returnedCF = await passwordQueryCheck;
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
                let query = 'SELECT * FROM DatiStudente WHERE CFPersona = @CFPersona';
                let preparedStatement = new dbConnection.PreparedStatement();
                preparedStatement.input('CFPersona', dbConnection.Char(16));
                preparedStatement.prepare(query,
                    err => 
                    {
                        if(err)
                            reject(err);
                        preparedStatement.execute({'CFPersona' : queryResult.CFPersona},
                            (err, result) =>
                            {
                                if(err)
                                    reject(err);
                                preparedStatement.unprepare(
                                    err => reject(err)
                                )
                                resolve(result.recordset[0]);
                            }
                        )
                    }
                )
            });
        }).catch((err) => {console.log(err); return {success : false, message : "Database error: " + err}});
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
        authorizedCookies.push(reutrnedObject);
    }
    return reutrnedObject;
}

resLogin.post('/', async function(req, res)
{
    let username = req.body.username, password = req.body.password;
    let allParameterReceived = (username && password);
    let allParameterOK = (username.length < 5 && password.length == 128);
    let result = await checkLogin(req.body.username, req.body.password);
    if(result.success)
    {
        res.cookie('cookie_monster', result.securedKey);
        res.redirect('/');
    }
    else
    {
        res.cookie('wrongCredential', 1);
        res.redirect('/');
    }
});



module.exports = resLogin;