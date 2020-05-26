var express = require('express');
var lezioniRouter = express.Router();
const RESCommonFunctions = require('./res-common-functions');

let getLezioniByStudente = async function (CodiceClasse) {
    let dbQuery = new Promise(
        (resolve, reject) => {
            dbConnection.connect(config, function (errConn) {
                if (errConn)
                    reject(errConn);

                let preparedStatement = new dbConnection.PreparedStatement();
                preparedStatement.input('CodiceClasse', dbConnection.VarChar(7));
                let query = 'SELECT * FROM getFirme WHERE CodiceClasse = @CodiceClasse ORDER BY DataFirma DESC, Ora DESC';
                preparedStatement.prepare(query,
                    errPrep => {
                        if (errPrep)
                            reject(errPrep);

                        preparedStatement.execute({ 'CodiceClasse': CodiceClasse },
                            (errExec, result) => {
                                if (errExec)
                                    reject(errExec);

                                preparedStatement.unprepare(
                                    errUnprep => reject(errUnprep)
                                )
                                resolve(result.recordset);
                            })
                    })
            });
        }).catch((err) => { console.log(err); return { success: false, message: "Database error: " + err } });
    let queryResult = await dbQuery;
    if (queryResult.length > 0)
    {
        for(let i = 0; i < queryResult.length; i++)
        {
            queryResult[i].DataFirma = RESCommonFunctions.dateToString(queryResult[i].DataFirma);
            delete queryResult[i].CFProfessore;

        }
        return { success: true, recordset: queryResult};
    }
    else
        return { success: false, message: "No Data Found" };

}
lezioniRouter.get('/', async function (req, res) {
    let session_cookie = req.cookies.cookie_monster;
    let datiStudente;
    if (session_cookie)
        datiStudente = getDatiStudenteByCookie(session_cookie);

    let lezioni;
    if (datiStudente)
        lezioni = await getLezioniByStudente(datiStudente.CodiceClasse);

    if (!session_cookie)
        res.redirect('/');
    else if (!datiStudente)
        res.redirect('/');
    else
        res.render('lezioni', { title: 'Lezioni', datiStudente: datiStudente, lezioni: lezioni.recordset });
});

module.exports = lezioniRouter;

