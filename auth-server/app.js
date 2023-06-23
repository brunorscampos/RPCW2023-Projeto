var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');

var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

var mongoose = require('mongoose')
var mongoDB = "mongodb://127.0.0.1/RPCW_TP"


mongoose.connect(mongoDB,{useNewUrlParser: true, useUnifiedTopology: true})

var db = mongoose.connection;

db.on('error',console.error.bind(console,'MongoDB connection error...'))
db.once('open',() => {
    console.log('Conexão ao MongoDB realizada com sucesso...')
})

var User = require('./controllers/user')

// Configuração da estratégia local
passport.use(new LocalStrategy(
  {usernameField: 'username'}, (username, password, done) => {
    User.lookup(username)
      .then(dados => {
        const user = dados
        if(!user) {return done(null, false, {message: 'This username does not exist!\n'})}
        if(password != user.password) {return done(null, false, {message: 'Wrong password!\n'})}
        return done(null, user)
      })
      .catch(e => done(e))
    })
)

// Indica-se ao passport como serializar o utilizador
passport.serializeUser((user,done) => {
  console.log('Serialize, uname: ' + user.username)
  done(null, user.username)
})
  
// Desserialização: a partir do id obtem-se a informação do utilizador
passport.deserializeUser((uname, done) => {
  console.log('Deserialize, username: ' + uname)
  User.lookup(uname)
    .then(dados => done(null, dados))
    .catch(erro => done(erro, false))
})
  
var usersRouter = require('./routes/user');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());
app.use(passport.session());

app.use('/users', usersRouter);

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
