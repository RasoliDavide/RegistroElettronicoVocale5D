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


var resRouter = require('./routes/REStudenti');
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

app.use('/', resRouter);
app.use('/api', angularRouter);

module.exports = app;
