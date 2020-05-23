const express = require('express');
const votiRouter = express.Router();

const RECommonFunctions = require('../common-functions');
checkAuthorization = (req, res, next) => {return RECommonFunctions.checkAuthorizationM(req, res, next);}

let inserisciVoto = async function(voto)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            preparedStatement.input('CFProfessore', dbConnection.Char(16));
            preparedStatement.input('Voto', dbConnection.Decimal(5,2));
            preparedStatement.input('Descrizione', dbConnection.VarChar(500));
            preparedStatement.input('Tipologia', dbConnection.TinyInt());
            preparedStatement.input('Peso', dbConnection.TinyInt());
            preparedStatement.input('DataVoto', dbConnection.Date());
            preparedStatement.input('CodiceMateria', dbConnection.Int());
            if(voto.Descrizione == undefined || voto.Descrizione == '')
                voto.Descrizione = '';
            let query = 'INSERT INTO Voto (Voto, Tipologia, Peso, Descrizione, CFStudente, CFProfessore, CodiceMateria, DataVoto) VALUES (@Voto, @Tipologia, @Peso, @Descrizione, @CFStudente, @CFProfessore, @CodiceMateria, @DataVoto)';
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({ 'Voto' : voto.Voto,
                                            'Tipologia' : voto.Tipologia,
                                            'Peso' : voto.Peso,
                                            'Descrizione' : voto.Descrizione,
                                            'CFStudente' : voto.CFStudente,
                                            'CFProfessore' : voto.CFProfessore,
                                            'CodiceMateria' : voto.CodiceMateria,
                                            'DataVoto' : voto.DataVoto},
                                
                (errExec, result) =>
                {                
                    if(errExec)
                        reject(errExec);

                    preparedStatement.unprepare(
                        errUnprep => {if(errUnprep) reject(errUnprep)}
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
    }).catch((err) => {console.log(err); return {success : "false", message : err}});
    let queryResult = await dbQuery;
    if(queryResult == 1)
        return {success : true};
    else if(queryResult == 0)
        return {success : false, message : "No row affected"}
    else
        return queryResult;
}

votiRouter.post('/inserisciVoto', checkAuthorization, async function(req, res)
{
    //UsernameStudente, Voto, Tipologia, Peso, Descrizione, CFProfessore, CodiceMateria, DataVoto
    let voto = req.body;
    let allParameterReceived = (voto.UsernameStudente && voto.Voto && voto.Tipologia != undefined && voto.Peso &&  voto.CFProfessore && voto.CodiceMateria && voto.DataVoto);
    let usernameStudenteOK, votoOK, tipologiaOK, pesoOK, cfProfessoreOK, coerenzaOK, allParameterOK;
    if(allParameterReceived)
    {
        usernameStudenteOK = (voto.UsernameStudente.length == 5);
        votoOK = (voto.Voto >= 1 && voto.Voto <= 10);
        tipologiaOK = (voto.Tipologia >= 0 && voto.Tipologia <= 2);
        pesoOK = (voto.Peso >= 0 && voto.Peso <= 100);
        coerenzaOK = (((voto.Tipologia == 0 || voto.Tipologia == 2) && (voto.Peso == 0)) || ((voto.Tipologia == 1) && (voto.Peso != 0)))
        cfProfessoreOK = (voto.CFProfessore.length == 16);
        allParameterOK = (usernameStudenteOK && votoOK && tipologiaOK && pesoOK && coerenzaOK && cfProfessoreOK)
    }
    let cfStudente;
    if(allParameterOK)
        cfStudente = await RECommonFunctions.getCFStudenteByUsername(voto.UsernameStudente);

    let result;
    if(allParameterOK && cfStudente != undefined)
    {
        voto['CFStudente'] = cfStudente;
        delete voto.UsernameStudente;
        result = await inserisciVoto(voto);
    }
    if(!allParameterReceived)
        res.status(400).send({success : false, message : "Missing parameter(s)"});
    else if(!usernameStudenteOK)
        res.status(400).send({success : false, message : "Numero di caratteri di UsernameStudente non corretto"});
    else if(!votoOK)
        res.status(400).send({success : false, message : "Voto non nel range"});
    else if(!tipologiaOK)
        res.status(400).send({success : false, message : "Tipologia non corretta"});
    else if(!pesoOK)
        res.status(400).send({success : false, message : "Peso non nel range"});
    else if(!coerenzaOK)
        res.status(400).send({success : false, message : "Tipologia e peso inseriti non compatibili"});
    else if(!cfProfessoreOK)
        res.status(400).send({success : false, message : "Numero di caratteri di UsernameStudente non corretto"});
    else if(!cfStudente == undefined)
        res.status(404).send({success : false, message : "Lo Username inserito non è stato trovato nel database"});
    else if(!result.success)
        res.status(500).send(result);
    else
        res.status(201).send(result);
})

let getVotiByStudente = async function(cfStudente)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(err) {
            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            let query = 'SELECT * FROM getVotiByStudente WHERE CFStudente = @CFStudente';
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({'CFStudente' : cfStudente},
                (errExec, result) =>
                {                
                    if(errExec)
                        reject(errExec);

                    preparedStatement.unprepare(
                        errUnprep => reject(errUnprep)
                    )
                    resolve(result);
                })
            })
        });
    }).catch((err) => {console.log(err); return {success : false, message : "Database error: " + err}});

    let reutrnedObject = await dbQuery;
    if(reutrnedObject.recordset)
    {
        for(let i = 0; i < reutrnedObject.recordset; i++)
            delete reutrnedObject.recordset[i].CFStudente
        return {success: true, recordset : reutrnedObject.recordset};
    }
    else
        return reutrnedObject;
}

votiRouter.get('/getVotiByStudente', checkAuthorization, async function(req, res)
{
    //UsernameStudente
    let allParameterReceived = req.query.UsernameStudente != undefined;
    let usernameStudenteOK;
    if(allParameterReceived)
        usernameStudenteOK = (req.query.UsernameStudente.length == 5);

    
    let cfStudente;
    if(usernameStudenteOK)
        cfStudente = await RECommonFunctions.getCFStudenteByUsername(req.query.UsernameStudente);

    let result;
    if(usernameStudenteOK && cfStudente != undefined)
        result = await getVotiByStudente(cfStudente);

    if(!allParameterReceived)
        res.status(400).send({success : false, message : "Missing parameter(s)"});
    else if(!usernameStudenteOK)
        res.status(400).send({success : false, message : "Numero di caratteri di UsernameStudente non corretto"});
    else if(cfStudente == undefined)
        res.status(404).send({success : false, message : "Lo Username inserito non è stato trovato nel database"});
    else if(!result.success)
        res.status(500).send(result);
    else
        res.status(200).send(result.recordset);
})

module.exports = votiRouter;