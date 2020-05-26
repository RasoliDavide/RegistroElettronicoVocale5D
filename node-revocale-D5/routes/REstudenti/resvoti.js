var express = require('express');
var votiRouter = express.Router();
const RESCommonFunctions = require('./res-common-functions') 

let getVotiByStudente = async function(cfStudente)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);

            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            let query = 'SELECT * FROM getVotiByStudentePerStudente WHERE CFStudente = @CFStudente ORDER BY DataVoto DESC';
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
            switch(queryResult[i].Tipologia)
            {
                case(0):
                    queryResult[i].Tipologia = 'Senza Valore';
                    break;
                case(1):
                    queryResult[i].Tipologia = 'Con Valore';
                    break;
                case(2):
                    queryResult[i].Tipologia = 'Recupero';
                    break;
            }
            queryResult[i].DataVoto = RESCommonFunctions.dateToString(queryResult[i].DataVoto);
            
        }
        return {success : true, recordset : queryResult}
    }
    else
        return {success : false};
}

votiRouter.get('/', async function(req, res)
{
    let session_cookie = req.cookies.cookie_monster;
    let datiStudente;
    if(session_cookie)
        datiStudente = getDatiStudenteByCookie(session_cookie);

    let voti;
    if(datiStudente)
        voti = await getVotiByStudente(datiStudente.CFPersona);
    
    if(!session_cookie)
        res.redirect('/');
    else if(!datiStudente)
        res.redirect('/');
    else
        res.render('voti', {title : 'Voti', datiStudente : datiStudente, voti : voti.recordset});
})

module.exports = votiRouter;