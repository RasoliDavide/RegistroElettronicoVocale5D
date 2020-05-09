const express = require('express');
const angularRouter = express.Router();
const dbConnection = require('mssql');
const sha512 = require('js-sha512');
const randomint = require('random-int');
const config = {
    user: '4dd_20', //Vostro user name
    password: 'xxx123##', //Vostra password
    server: "213.140.22.237", //Stringa di connessione
    database: 'REVocale-5D', //(Nome del DB)
}

let authorizedKey = [
    {
            'cfProf' : "dsa",
            'securedKey' : "all"
    }
];

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
        delete reutrnedObject[0].CFProfessore;

    return reutrnedObject;
}

angularRouter.get('/getTeachingClasses', async function(req, res)
{
    let result = await getTeachingClasses(req.query.cfProfessore);
    res.send(result);
})

let getVotiByStudente = async function(cfStudente)
{
    let voti;
    let dbQuery = new Promise(
    (resolve, reject) => 
    {
        dbConnection.connect(config, function(err) {
            let query = 'SELECT * FROM Voto WHERE CFStudente = @cfStudente';
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('cfStudente', dbConnection.Char(16));
            preparedStatement.prepare(query,
            err => 
            {
                if(err)
                    console.log(err);

                preparedStatement.execute({'cfStudente' : cfStudente},
                (err, result) =>
                {
                    preparedStatement.unprepare(
                        err => reject(err)
                    )
                    resolve(result.recordset);
                })
            })
        });
    })

    let reutrnedObject = await dbQuery;
    return reutrnedObject;
}

angularRouter.get('/getVotiByStudente', async function(req, res)
{
    let result = await getVotiByStudente(req.query.cfStudente);
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



let getStudemtiByClasse = async function(codiceClasse)
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

angularRouter.get('/getStudentiByClasse', checkAuthorization, async function(req, res)
{
    let result = await getStudemtiByClasse(req.query.codiceClasse);
    res.send(result);
})

let inserisciAssenza = async function(assenza)
{
    let query;
    console.log(assenza);
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(err) {
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            preparedStatement.input('CFProfessore', dbConnection.Char(16));
            preparedStatement.input('Tipo', dbConnection.Char(1));
            preparedStatement.input('DataAssenza', dbConnection.Date());
            preparedStatement.input('Concorre', dbConnection.Bit());
            if(assenza.Tipo == 'A')
            {
                query = 'INSERT INTO Assenza (CFStudente, CFProfessore, Tipo, DataAssenza, Concorre) VALUES (@CFStudente, @CFProfessore, @Tipo, @DataAssenza, @Concorre)';
            }
            else
            {
                preparedStatement.input('Ora', dbConnection.VarChar(5));
                query = 'INSERT INTO Assenza (CFStudente, CFProfessore, Tipo, DataAssenza, Concorre, Ora) VALUES (@CFStudente, @CFProfessore, @Tipo, @DataAssenza, @Concorre, @Ora)';
            }
            
            preparedStatement.prepare(query,
            err => 
            {
                if(err)
                    console.log(err);
                preparedStatement.execute({'CFStudente' : assenza.CFStudente, 
                                           'CFProfessore' : assenza.CFProf,
                                           'Tipo' : assenza.Tipo,
                                           'DataAssenza' : assenza.DataAssenza,
                                           'Concorre' : assenza.Concorre,
                                           'Ora' : assenza.Ora},
                                
                                    
                (err, result) =>
                {                
                    if(err)
                        console.log(err);
                    preparedStatement.unprepare(
                        err => console.log(err)
                    )
                    console.log(result);
                    resolve(result.recordset);
                })
            })
        });
    });
    let queryResult = await dbQuery;

    return queryResult;
}

let getCFStudenteByUsername = async function(username)
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

                    resolve(result.recordset[0].CFPersona);
                })
            })
        });
    });
    let queryResult = await dbQuery;
    console.log(queryResult);
    return queryResult;
}

angularRouter.post('/inserisciAssenza', checkAuthorization, async function(req, res)
{
    console.log("Key OK");
    //Tipo, Data, Motivazione, Concorre, Ora, CFProf, UsernameStudente
    let assenza = req.body;
    let result;
    //console.log(assenza);
    if((assenza.Tipo == 'A' || assenza.Tipo == 'E' || assenza.Tipo == 'U') && assenza.DataAssenza && assenza.Concorre && assenza.CFProf && assenza.UsernameStudente)
    {
        console.log("Dentro l'if");
        let cfStudente = await getCFStudenteByUsername(assenza.UsernameStudente);
        //console.log(cfStudente);
        delete assenza.UsernameStudente;
        assenza['CFStudente'] = cfStudente;
        result = await inserisciAssenza(assenza);
        
    }
    res.send("OK")
})

module.exports = angularRouter;
