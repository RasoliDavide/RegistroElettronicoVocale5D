var express = require('express');
var comunicazioniRouter = express.Router();
const RESCommonFunctions = require('./res-common-functions') 

let getComunicazioni = async function(codiceClasse)
{
    let dbQuery = new Promise(
        (resolve, reject) => {
            dbConnection.connect(config, async function (errConn) {
                if (errConn)
                    reject(errConn);
                
                let query = 'SELECT * FROM getComunicazioniPerStudente WHERE CodiceClasse = @CodiceClasse';

                let preparedStatementCodici = new dbConnection.PreparedStatement();
                preparedStatementCodici.input('CodiceClasse', dbConnection.VarChar(7));
                preparedStatementCodici.prepare(query, async function(errPrep)
                {
                    if (errPrep)
                        reject(errPrep);
                    preparedStatementCodici.execute({'CodiceClasse' : codiceClasse}, async function(errExec, result)
                    {
                        if (errExec)
                            reject(errExec);
                        preparedStatementCodici.unprepare(errUnprep => {reject(errUnprep)});
                        resolve(result.recordset);
                    });
                });
            });
        }).catch((err) => {console.log(err); return {success : false, message : "Database error: " + err}});
    let queryResult = await dbQuery;
    if (queryResult.length > 0)
    {
        for(let i = 0; i < queryResult.length; i++)
            delete queryResult[i].CodiceClasse;
        return { success: true, recordSet: queryResult };
    }
    else
        return { success: false };
}

comunicazioniRouter.get('/', async function(req, res)
{
    let session_cookie = req.cookies.cookie_monster;
    let datiStudente;
    if(session_cookie)
        datiStudente = getDatiStudenteByCookie(session_cookie);

    let comunicazioni;
    if(datiStudente)
        comunicazioni = await getComunicazioni(datiStudente.CodiceClasse);
    
    console.log(comunicazioni);

    if(!session_cookie)
        res.redirect('/');
    else if(!datiStudente)
        res.redirect('/');
    else
        res.render('comunicazioni', {title : 'comunicazioni', datiStudente : datiStudente, comunicazioni : comunicazioni.recordSet});
})

module.exports = comunicazioniRouter;