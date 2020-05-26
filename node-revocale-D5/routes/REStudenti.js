var express = require('express');
var resRouter = express.Router();
const resLogin = require('./REstudenti/relogin');

const LoginFunctions = require('./REstudenti/resprofilo');
const assenzeRouter = require('./REstudenti/resassenze');

getDatiStudenteByCookie = function(cookie)
{
    var loggedIn = authorizedCookies.find((key) => 
    {
        return key.securedKey == cookie;
    });
    if(loggedIn)
        return loggedIn;
    else 
        return null;
}


authorizedCookies = [];


resRouter.get('/', async function(req, res){ 
    let cookieLogin = req.cookies.cookie_monster;
    if (cookieLogin == undefined)
    {
        res.clearCookie('wrongCredential');
        res.render('login', { title: 'login', wrongCredential: req.cookies.wrongCredential});
    }
    else 
    {
        let datiStudente = getDatiStudenteByCookie(cookieLogin);
        if(datiStudente)
            res.render('profilo', {title:'Profilo', datiStudente : datiStudente});
        else
        {
            res.clearCookie('cookie_monster');
            res.render('login', {title : "Login"});
        }
    }
});

resRouter.use('/login', resLogin);
resRouter.use('/assenze', assenzeRouter);

resRouter.get('/logout', function(req, res)
{
    let session_cookie = req.cookies.cookie_monster;
    let datiStudente;

    if(session_cookie)
        datiStudente = getDatiStudenteByCookie(session_cookie);

    if(datiStudente && session_cookie)
    {
        let index = authorizedCookies.findIndex((el) => {return el == datiStudente});
        authorizedCookies.splice(index, 1);
        res.clearCookie('cookie_monster');
    }
    else if(session_cookie)
        res.clearCookie('cookie_monster');

    res.redirect('/');
})

module.exports = resRouter;
