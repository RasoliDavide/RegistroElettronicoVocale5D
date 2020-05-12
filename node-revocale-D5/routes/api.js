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
            errP => 
            {
                if(errP)
                    reject(errP);

                preparedStatement.execute({'CFStudente' : assenza.CFStudente, 
                                           'CFProfessore' : assenza.CFProfessore,
                                           'Tipo' : assenza.Tipo,
                                           'DataAssenza' : assenza.DataAssenza,
                                           'Concorre' : assenza.Concorre,
                                           'Ora' : assenza.Ora},
                
                (errE, result) =>
                {                
                    if(errE)
                        reject(errE);

                    preparedStatement.unprepare(
                        errU => resolve(errU)
                    )
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

angularRouter.post('/inserisciAssenza', checkAuthorization, async function(req, res)
{
    //Tipo, Data, Motivazione, Concorre, Ora, CFProfessore, UsernameStudente
    let assenza = req.body;
    let result;
    if((assenza.Tipo == 'A' || assenza.Tipo == 'E' || assenza.Tipo == 'U') && assenza.DataAssenza && assenza.Concorre && assenza.CFProfessore && assenza.UsernameStudente)
    {
        console.log("Dentro l'if");
        let cfStudente = await getCFStudenteByUsername(assenza.UsernameStudente);
        delete assenza.UsernameStudente;
        assenza['CFStudente'] = cfStudente;
        result = await inserisciAssenza(assenza);
    }
    res.send(result)
})

let giustificaAssenza = async function(giustifica)
{

    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(err) {
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            preparedStatement.input('Tipo', dbConnection.Char(1));
            preparedStatement.input('DataAssenza', dbConnection.Date());
            preparedStatement.input('Motivazione', dbConnection.VarChar(200));
            let query = 'UPDATE Assenza SET Motivazione = @Motivazione WHERE CFStudente = @CFStudente AND Tipo = @Tipo AND DataAssenza = @DataAssenza';
            
            preparedStatement.prepare(query,
            errP => 
            {
                if(errP)
                    console.log(errP);

                preparedStatement.execute({'CFStudente' : giustifica.CFStudente, 
                                           'Tipo' : giustifica.Tipo,
                                           'DataAssenza' : giustifica.DataAssenza,
                                           'Motivazione' : giustifica.Motivazione,
                                        },
                (errE, result) =>
                {                
                    if(errE)
                        console.log(errE);

                    preparedStatement.unprepare(
                        errU => console.log(errU)
                    )
                    console.log(result)
                    resolve(result);
                })
            })
        });
    });
    let queryResult = await dbQuery;
    return queryResult
}

angularRouter.post('/giustificaAssenza', checkAuthorization, async function(req, res)
{
    //UsernameStudente, Tipo, DataAssenza, Motivazione
    let giustifica = req.body;
    console.log(giustifica)
    let result;
    if((giustifica.Tipo == 'A' || giustifica.Tipo == 'E' || giustifica.Tipo == 'U') && giustifica.Motivazione && giustifica.DataAssenza && giustifica.UsernameStudente)
    {
        console.log("Dentro l'if");
        let cfStudente = await getCFStudenteByUsername(giustifica.UsernameStudente);
        delete giustifica.UsernameStudente;
        giustifica['CFStudente'] = cfStudente;
        console.log(giustifica);
        result = await giustificaAssenza(giustifica);
    }
    res.send(result);
})

let getAssenzaByStudente = async function(cfStudente)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(err) {
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            let query = 'SELECT * FROM Assenza WHERE CFStudente = @CFStudente';
            preparedStatement.prepare(query,
            errP => 
            {
                if(errP)
                    console.log(errP);

                preparedStatement.execute({'CFStudente' : cfStudente},
                (errE, result) =>
                {                
                    if(errE)
                        console.log(errE);

                    preparedStatement.unprepare(
                        errU => console.log(errU)
                    )
                    console.log(result)
                    resolve(result.recordset);
                })
            })
        });
    });
    let queryResult = await dbQuery;
    return queryResult;
}

angularRouter.get('/getAssenzeByStudente', checkAuthorization, async function(req, res)
{
    let result;
    let cfStudente = await getCFStudenteByUsername(req.query.UsernameStudente);
    if(cfStudente != undefined)
    {
        result = await getAssenzaByStudente(cfStudente);
    }
    res.send(result);
})

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

module.exports = angularRouter;