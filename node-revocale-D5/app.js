var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
dbConnection = require('mssql');


config = {
    user: '4dd_20', //Vostro user name
    password: 'xxx123##', //Vostra password
    server: "213.140.22.237", //Stringa di connessione
    database: 'REVocale-5D', //(Nome del DB)
}


var indexRouter = require('./routes/index');
var angularRouter = require('./routes/api');


var app = express();


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);
app.use('/api', angularRouter);

app.get('/assenze', (req, res) => {  
  res.render('assenze', {
    title: `assenze`
  });
});
app.get('/compiti', (req, res) => {  
  res.render('compiti', {
    title: `compiti`
  });
});
app.get('/comunicazioni', (req, res) => {  
  res.render('comunicazioni', {
    title: `comunicazioni`
  });
});
app.get('/lezioni', (req, res) => {  
  res.render('lezioni', {
    title: `lezioni`
  });
});
app.get('/note', (req, res) => {  
  res.render('note', {
    title: `note`
  });
});
app.get('/profilo', (req, res) => {  
  res.render('profilo', {
    title: `profilo`
  });
});
app.get('/voti', (req, res) => {  
  res.render('voti', {
    title: `voti`
  });
});
module.exports = app;
