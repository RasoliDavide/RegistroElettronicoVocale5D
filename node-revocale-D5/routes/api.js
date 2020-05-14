const express = require('express');
const angularRouter = express.Router();
const sha512 = require('js-sha512');
const randomint = require('random-int');

const apiProf = require('./api/prof');
const apiAssenza = require('./api/assenza');

angularRouter.use('/prof', apiProf);
angularRouter.use('/assenza', apiAssenza);

authorizedKey = 
[
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

angularRouter.post('/login', checkPostPayloadMiddleware, async function(req, res)
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
    console.log(queryResult);

    return queryResult;
}





let inserisciVoto = async function(assenza)
{
    console.log(assenza);
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(err) {
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            preparedStatement.input('CFProfessore', dbConnection.Char(16));
            preparedStatement.input('Voto', dbConnection.Decimal(5,2));
            preparedStatement.input('Descrizione', dbConnection.VarChar(500));
            preparedStatement.input('Tipologia', dbConnection.TinyInt());
            preparedStatement.input('Peso', dbConnection.TinyInt());
            preparedStatement.input('DataVoto', dbConnection.Date());
            preparedStatement.input('CodiceMateria', dbConnection.Int());
            if(assenza.Descrizione == undefined || assenza.Descrizione == '')
                assenza.Descrizione = '';
            let query = 'INSERT INTO Voto (Voto, Tipologia, Peso, Descrizione, CFStudente, CFProfessore, CodiceMateria, DataVoto) VALUES (@Voto, @Tipologia, @Peso, @Descrizione, @CFStudente, @CFProfessore, @CodiceMateria, @DataVoto)';
            preparedStatement.prepare(query,
            errP => 
            {
                if(errP)
                    console.log(errP);

                preparedStatement.execute({ 'Voto' : assenza.Voto,
                                            'Tipologia' : assenza.Tipologia,
                                            'Peso' : assenza.Peso,
                                            'Descrizione' : assenza.Descrizione,
                                            'CFStudente' : assenza.CFStudente,
                                            'CFProfessore' : assenza.CFProfessore,
                                            'CodiceMateria' : assenza.CodiceMateria,
                                            'DataVoto' : assenza.DataVoto},
                                
                (errE, result) =>
                {                
                    if(errE)
                        console.log(errE);

                    preparedStatement.unprepare(
                        errU => console.log(errU)
                    )
                    console.log(result)
                    if(result)
                        resolve(result.rowsAffected[0]);
                    else
                    {
                        err = new Error("No returned values")
                        reject(err);
                    }
                })
            })
        });
    }).catch((err) => {return {success : "false"}});
    let queryResult = await dbQuery;
    if(queryResult == 1)
        return {success : "true"}
    else
        return {success : "false"}
    return queryResult;
}

angularRouter.post('/inserisciVoto', checkAuthorization, async function(req, res)
{
    let result;
    //UsernameStudente, Voto, Tipologia, Peso, Descrizione, CFProfessore, CodiceMateria, DataVoto
    let voto = req.body;
    if(voto.UsernameStudente && voto.Voto && voto.Tipologia && voto.Peso &&  voto.CFProfessore && voto.CodiceMateria && voto.DataVoto)
    {
        voto['CFStudente'] = await getCFStudenteByUsername(voto.UsernameStudente);
        if(voto['CFStudente'] != undefined)
        {
            delete voto.UsernameStudente;
            console.log("576", voto['CFStudente'])
            result = await inserisciVoto(voto);
        }
        else
            result = {success : "false"};
    }
    res.send(result);
})

let getVotiByStudente = async function(cfStudente)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(err) {
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            let query = 'SELECT * FROM Voto WHERE CFStudente = @CFStudente';
            preparedStatement.prepare(query,
            errP => 
            {
                if(errP)
                    reject(errP);

                preparedStatement.execute({'CFStudente' : cfStudente},
                (errE, result) =>
                {                
                    if(errE)
                        reject(errE);

                    preparedStatement.unprepare(
                        errU => reject(errU)
                    )
                    resolve(result.recordset);
                })
            })
        });
    });
    let queryResult = await dbQuery;
    return queryResult;
}

angularRouter.get('/getVotiByStudente', checkAuthorization, async function(req, res)
{
    let result;
    //usernameStudente
    let usernameStudente = req.query.usernameStudente;
    if(usernameStudente != undefined)
    {
        let cfStudente = await getCFStudenteByUsername(usernameStudente);
        if(cfStudente != undefined)
        {
            result = await getVotiByStudente(cfStudente);
            console.log(result)
        }
    }
    res.send(result);
})

angularRouter.post('/logout', checkAuthorization, function(req, res)
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
module.exports = angularRouter;