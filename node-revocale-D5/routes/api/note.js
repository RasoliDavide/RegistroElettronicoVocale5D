const express = require('express');
const noteRouter = express.Router();

const RECommonFunctions = require('../common-functions');
checkAuthorization = (req, res, next) => {return RECommonFunctions.checkAuthorizationM(req, res, next);}

noteRouter.post('/inserisciNota', checkAuthorization, async function(res, req)
{
    let nota = req.body;
    let allParameterReceived = (nota.Tipologia != undefined && nota.Testo && nota.TipoPenalita != undefined && nota.CFProfessore && nota.CodiceClasse);

    let tipologiaOK, testoOK, tipoPenalitaOK, cfProfessoreOK, codiceClasseOK, coerenzaOK, allParameterOK;

    if(allParameterReceived)
    {
        tipologiaOK = (nota.Tipologia == 0 || nota.Tipologia == 1);
        testoOK = (nota.Testo != "" && nota.Testo.length < 400);
        tipoPenalitaOK = (nota.TipoPenalita >= 0 && nota.TipoPenalita <= 2);
        cfProfessoreOK = (nota.cfProfessore.length == 16);
        coerenzaOK = (((nota.CodiceClasse == undefined || nota.CodiceClasse == "") && nota.Tipologia == 0) || ((nota.CodiceClasse != undefined || nota.CodiceClasse != "") && nota.Tipologia == 1));
        allParameterOK = (testoOK && tipoPenalitaOK && cfProfessoreOK && coerenzaOK);
    }
    
})