var express = require('express');
var noteRouter = express.Router();
const RESCommonFunctions = require('./res-common-functions');

let getNoteByStudente = async function(cfStudente)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);

            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CFStudente', dbConnection.Char(16));
            let query = 'SELECT * FROM getNoteByStudente WHERE CFStudente = @CFStudente ORDER BY DataNota DESC';
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
            switch(queryResult[i].TipoPenalita)
            {
                case(0):
                    queryResult[i].TipoPenalita = 'Nota';
                    break;
                case(1):
                    queryResult[i].TipoPenalita = 'Sospensione';
                    break;
                case(2):
                    queryResult[i].TipoPenalita = 'Espulsione';
                    break;
            }
            queryResult[i].DataNota = RESCommonFunctions.dateToString(queryResult[i].DataNota);
            switch(queryResult[i].Tipologia)
            {
                case(0):
                    queryResult[i].Tipologia = 'Per studente';
                    break;
                case(1):
                    queryResult[i].Tipologia = 'Per classe';
                    break;
              
            }
        }
        return {success : true, recordset : queryResult}
    }
    else
        return {success : false};
}
let getNoteByClasse = async function(CodiceClasse)
{
    let dbQuery = new Promise(
    (resolve, reject) =>
    {
        dbConnection.connect(config, function(errConn) {
            if(errConn)
                reject(errConn);

            let preparedStatement = new dbConnection.PreparedStatement();
            preparedStatement.input('CodiceClasse', dbConnection.VarChar(7));
            let query = 'SELECT * FROM getNoteByClasse WHERE CodiceClasse = @CodiceClasse ORDER BY DataNota DESC';
            preparedStatement.prepare(query,
            errPrep => 
            {
                if(errPrep)
                    reject(errPrep);

                preparedStatement.execute({'CodiceClasse' : CodiceClasse},
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
            delete queryResult[i].CodiceClasse;
            switch(queryResult[i].TipoPenalita)
            {
                case(0):
                    queryResult[i].TipoPenalita = 'Nota';
                    break;
                case(1):
                    queryResult[i].TipoPenalita = 'Sospensione';
                    break;
                case(2):
                    queryResult[i].TipoPenalita = 'Espulsione';
                    break;
            }
            queryResult[i].DataNota = RESCommonFunctions.dateToString(queryResult[i].DataNota);
            switch(queryResult[i].Tipologia)
            {
                case(0):
                    queryResult[i].Tipologia = 'Per studente';
                    break;
                case(1):
                    queryResult[i].Tipologia = 'Per classe';
                    break;
              
            }
        }
        return {success : true, recordset : queryResult}
    }
    else
        return {success : false};
}

noteRouter.get('/', async function(req, res)
{
    let session_cookie = req.cookies.cookie_monster;
    let datiStudente;
    if(session_cookie)
        datiStudente = getDatiStudenteByCookie(session_cookie);

    let note;
    let noteClasse;
    if(datiStudente)
    {   
        note = await getNoteByStudente(datiStudente.CFPersona);
        noteClasse = await getNoteByClasse(datiStudente.CodiceClasse)
    }
    console.log(note);
    console.log(noteClasse);
    if(!session_cookie)
        res.redirect('/');
    else if(!datiStudente)
        res.redirect('/');
    else
        res.render('note', {title : 'Note', datiStudente : datiStudente, note : note.recordset, noteClasse:noteClasse.recordset});
})

module.exports = noteRouter;