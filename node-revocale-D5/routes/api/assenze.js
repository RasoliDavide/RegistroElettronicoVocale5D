const express = require('express');
const assenzeRouter = express.Router();

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

let inserisciAssenza = async function(assenza)
{
    let query;
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('cfStudente', dbConnection.Char(16));
            preparedStatement.input('CFProfessore', dbConnection.Char(16));
            preparedStatement.input('Tipo', dbConnection.Char(1));
            preparedStatement.input('DataAssenza', dbConnection.Date());
            preparedStatement.input('Concorre', dbConnection.Bit());
            if(assenza.tipo == 'A')
            {
                query = 'INSERT INTO Assenza (cfStudente, CFProfessore, Tipo, DataAssenza, Concorre) VALUES (@cfStudente, @CFProfessore, @Tipo, @DataAssenza, @Concorre)';
            }
            else
            {
                preparedStatement.input('Ora', dbConnection.VarChar(5));
                query = 'INSERT INTO Assenza (cfStudente, CFProfessore, Tipo, DataAssenza, Concorre, Ora) VALUES (@cfStudente, @CFProfessore, @Tipo, @DataAssenza, @Concorre, @Ora)';
            }
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);
                //console.log(assenza)
                preparedStatement.execute({'cfStudente' : assenza.cfStudente, 
                                           'CFProfessore' : assenza.cfProfessore,
                                           'Tipo' : assenza.tipo,
                                           'DataAssenza' : assenza.dataAssenza,
                                           'Concorre' : assenza.concorre,
                                           'Ora' : assenza.ora},
                
                (errExec, result) =>
                {      
                    if(errExec)
                        reject(errExec);

                    preparedStatement.unprepare(
                        errUnprep => reject(errUnprep)
                    )

                    if(result)
                        resolve(result.rowsAffected[0]);
                    else
                    {
                        err = new Error("No modified values")
                        reject(errExec);
                    }
                })
            })
        });
    }).catch((err) => {console.log(err); return {success : false, message : "Database error: " + err}});

    let queryResult = await dbQuery;
    if(queryResult == 1)
        return {success : true};
    else if(queryResult == 0)
        return {success : false, message : "No row affected"}
    else
        return queryResult;
}

assenzeRouter.post('/inserisciAssenza', checkAuthorization, async function(req, res)
{
    //tipo, dataAssenza, concorre, ora, cfProfessore, usernameStudente
    let assenza = req.body;
    
    let allParameterReceived = (assenza.tipo && assenza.dataAssenza && assenza.concorre && assenza.cfProfessore && assenza.usernameStudente);
    
    let assenzaOK = false;
    if(allParameterReceived)
        assenzaOK  = ((assenza.tipo == 'A' && (assenza.ora == undefined || assenza.ora == "")) ||  ((assenza.tipo == 'E' || assenza.tipo == 'U') && (assenza.ora || assenza.ora != "")));
    
    let cfStudente;
    if(allParameterReceived && assenzaOK)
        cfStudente = await getCFStudenteByUsername(assenza.usernameStudente);
    
    let result;
    if(allParameterReceived && assenzaOK && cfStudente != undefined)
    {
        delete assenza.usernameStudente;
        assenza['cfStudente'] = cfStudente;
        result = await inserisciAssenza(assenza);
    }
    console.log("130", result)
    if(!allParameterReceived)
        res.status(400).send({success : false, message : "Missing parameter(s)"});
    else if(!assenzaOK)
        res.status(400).send({success : false, message : "Tipo di assenza e ora non compatibili"});
    else if(!cfStudente)
        res.status(404).send({success : false, message : "Username dello studente non trovato nel database"});
    else if(!result.success)
        res.status(500).send(result);
    else
        res.status(201).send(result);
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

assenzeRouter.post('/giustificaAssenza', checkAuthorization, async function(req, res)
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

assenzeRouter.get('/getAssenzeByStudente', checkAuthorization, async function(req, res)
{
    let result;
    let cfStudente = await getCFStudenteByUsername(req.query.UsernameStudente);
    if(cfStudente != undefined)
    {
        result = await getAssenzaByStudente(cfStudente);
    }
    res.send(result);
})

module.exports = assenzeRouter;