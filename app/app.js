var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose')
var mongoDB = "mongodb://127.0.0.1/RPCW_TP"

const { v4: uuidv4 } = require('uuid')
var session = require('express-session')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

mongoose.connect(mongoDB,{useNewUrlParser: true, useUnifiedTopology: true})

var db = mongoose.connection;

db.on('error',console.error.bind(console,'MongoDB connection error...'))
db.once('open',() => {
    console.log('Conexão ao MongoDB realizada com sucesso...')
})

var indexRouter = require('./routes/index');

var app = express();

app.use(session({
  genid: req => {
    return uuidv4()},
  secret: 'tprpcw',
  resave: false,
  saveUninitialized: true
}))

// Configuração do passport
var User = require('./models/user')
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
//app.use('/api/', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;


