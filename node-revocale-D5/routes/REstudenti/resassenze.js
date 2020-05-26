var express = require('express');
var assenzeRouter = express.Router();
const RESCommonFunctions = require('./res-common-functions');

let getAssenzaByStudente = async function(cfStudente)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);

            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            let query = 'SELECT * FROM Assenza WHERE CFStudente = @CFStudente';
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
                    resolve(result.recordset);
                })
            })
        });
    }).catch((err) => {console.log(err); return {success: false, message: "Database error: " + err }});
    let queryResult = await dbQuery;
    if(queryResult)
    {
        for(let i = 0; i < queryResult.length; i++)
        {
            delete queryResult[i].CFStudente;
            delete queryResult[i].CFProfessore;
            switch(queryResult[i].Tipo)
            {
                case('A'):
                    queryResult[i].Tipo = 'Assenza';
                    break;
                case('E'):
                    queryResult[i].Tipo = 'Entrata posticipata';
                    break;
                case('U'):
                    queryResult[i].Tipo = 'Uscita anticipata';
                    break;
            }
            queryResult[i].DataAssenza = RESCommonFunctions.dateToString(queryResult[i].DataAssenza);
            if(queryResult[i].Ora)
                queryResult[i].Ora = RESCommonFunctions.timeToString(queryResult[i].Ora);
            if(queryResult[i].Concorre)
                queryResult[i].Concorre = "Sì";
            else
                queryResult[i].Concorre = "No";
        }
        return {success : true, recordset : queryResult}
    }
    else
        return {success : false};
}

assenzeRouter.get('/', async function(req, res) 
{  
    let session_cookie = req.cookies.cookie_monster;
    let datiStudente;
    if(session_cookie)
        datiStudente = getDatiStudenteByCookie(session_cookie);

    let assenze;
    if(datiStudente)
        assenze = await getAssenzaByStudente(datiStudente.CFPersona);
    
    if(!session_cookie)
        res.redirect('/');
    else if(!datiStudente)
        res.redirect('/');
    else
        res.render('assenze', {title : 'Assenze', datiStudente : datiStudente, assenze : assenze.recordset});
});

module.exports = assenzeRouter;
