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

assenzeRouter.post('/inserisciAssenza', checkAuthorization, async function(req, res)
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