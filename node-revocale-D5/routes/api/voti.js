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
                    if(errE)
                        console.log(errExec);

                    preparedStatement.unprepare(
                        errUnprep => console.log(errUnprep)
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
    }).catch((err) => {return {success : "false", message : err}});
    let queryResult = await dbQuery;
    if(queryResult == 1)
        return {success : "true"}
    else
        return {success : "false"}
    return queryResult;
}

votiRouter.post('/inserisciVoto', checkAuthorization, async function(req, res)
{
    let result;
    //UsernameStudente, Voto, Tipologia, Peso, Descrizione, CFProfessore, CodiceMateria, DataVoto
    let voto = req.body;
    if(voto.UsernameStudente && voto.Voto && voto.Tipologia != undefined && voto.Peso &&  voto.CFProfessore && voto.CodiceMateria && voto.DataVoto)
    {
        voto['CFStudente'] = await RECommonFunctions.getCFStudenteByUsername(voto.UsernameStudente);
        console.log(voto)
        if(voto['CFStudente'] != undefined)
        {
            delete voto.UsernameStudente;
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

votiRouter.get('/getVotiByStudente', checkAuthorization, async function(req, res)
{
    let result;
    //usernameStudente
    let usernameStudente = req.query.UsernameStudente;
    if(usernameStudente != undefined)
    {
        let cfStudente = await RECommonFunctions.getCFStudenteByUsername(usernameStudente);
        if(cfStudente != undefined)
        {
            result = await getVotiByStudente(cfStudente);
            console.log(result)
        }
    }
    else
        res.status(400).send({"message" : "Missing \"UsernameStudente\" parameter"});
    res.send(result);
})

module.exports = votiRouter;