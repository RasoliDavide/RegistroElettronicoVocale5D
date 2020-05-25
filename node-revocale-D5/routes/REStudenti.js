var express = require('express');
var resRouter = express.Router();

/* GET home page. */
const resLogin = require('./REstudenti/relogin');
const LoginFunctions = require('./REstudenti/resprofilo');
resRouter.use('/login', resLogin);


authorizedCookies = [];



resRouter.get('/', async function(req, res){ 
    let cookieLogin = req.cookies.cookie_monster;
    if (cookieLogin == undefined)
    {
        res.clearCookie('wrongCredential');
        res.render('login', { title: 'login', wrongCredential: req.cookies.wrongCredential});
    }
    else {
        var loggedIn = authorizedCookies.find((key) => {
            return key.securedKey == cookieLogin;
        });
        let datiStudente = await LoginFunctions.getDatiStudente(loggedIn.cfStudente);
        res.render('profilo', {title:'Profilo', datiStudente : datiStudente.datiStudente});
    }
});

resRouter.get('/assenze', (req, res) => {
    res.render('assenze', {
        title: `assenze`
    });
});

resRouter.get('/comunicazioni', (req, res) => {
    res.render('comunicazioni', {
        title: `comunicazioni`
    });
});

resRouter.get('/lezioni', (req, res) => {
    res.render('lezioni', {
        title: `lezioni`
    });
});

resRouter.get('/note', (req, res) => {
    res.render('note', {
        title: `note`
    });
});

resRouter.get('/profilo', (req, res) => {
    res.render('profilo', {
        title: `profilo`
    });
});

resRouter.get('/voti', (req, res) => {
    res.render('voti', {
        title: `voti`
    });
});


module.exports = resRouter;
