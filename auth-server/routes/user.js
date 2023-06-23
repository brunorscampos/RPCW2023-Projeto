var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken')
var passport = require('passport')
var User = require('../controllers/user')

router.get('/', function(req, res){
  User.users()
    .then(dados => res.status(200).jsonp({dados: dados}))
    .catch(e => res.status(500).jsonp({error: e}))
})

router.post('/register', function(req, res){
  console.log(req.body)
  
  regex = /^[a-zA-Z0-9._-]+$/g
  spaces = /^\s*$/g
  
  if(req.body.username.match(spaces) || req.body.password.match(spaces)){
    res.status(400).jsonp({message: "Please fill up the entire form!", level: req.body.level})
  }
  
  else if(req.body.username.match(regex)){
    User.lookup(req.body.username)
      .then(r => {
        if(r == null){
          var data = new Date().toISOString().substring(0, 16)
          req.body.dateCreated = data
          req.body.lastAccessDate = data
          req.body.favorites = []
          if(req.body.level){
            User.insertUser(req.body)
              .then(data => res.status(201).jsonp({dados: data}))
              .catch(e => res.status(500).jsonp({error: e}))
          }
          else{
            //User.insertUser({username: req.body.username, password: req.body.password, level: 'producer'})
            User.insertUser(req.body)
              .then(data => res.status(201).jsonp({dados: data}))
              .catch(e => res.status(500).jsonp({error: e}))
          }
        }
        else{
          res.status(400).jsonp({message:"The username " + req.body.username + " is already taken!"})
        }
      })
      .catch(e => res.status(500).jsonp({error: e}))
  }
  else{
    res.status(400).jsonp({message:"Your username can only contain alphanumeric characters, dots, underscores and hyphens!"})
  }
})

router.post('/login',  passport.authenticate('local'), function(req, res){
  console.log('Body: ' + req.user)
  User.lookup(req.user.username)
  .then(r => {
    if(r == null){
      res.status(400).jsonp({message:"failed to log in"})
    }
    else{
      jwt.sign({ username: req.user.username, level: r.level, 
        sub: 'Acordaos'}, 
        "TPRPCW",
        {expiresIn: 3600},
        function(e, token) {
          if(e) {
            res.status(500).jsonp({error: "Unable to generate the token: " + e}) 
          }
          else {
            var data = new Date().toISOString().substring(0, 16)
            User.updateUserLastAccessDate(req.user, data)
              .then(data => {
                res.status(201).jsonp({token: token})
                console.log(token)
              })
              .catch(e => res.status(500).jsonp({error: e}))
          }
      });
    }
  })
})

router.get('/:username/favorites', function(req, res){
  User.getUserFavorites(req.params.username)
    .then(favorites => res.status(200).jsonp(favorites))
    .catch(e => res.status(500).jsonp({error: e}))
})

router.post('/:username/favorites/add', function(req, res){
  console.log(req.body)
  User.addUserFavorite(req.params.username,req.body)
    .then(f => res.status(200).jsonp(f))
    .catch(e => res.status(500).jsonp({error: e}))
})

router.post('/:username/favorites/remove', function(req, res){
  console.log(req.body)
  User.removeUserFavorite(req.params.username,req.body)
    .then(f => res.status(200).jsonp(f))
    .catch(e => res.status(500).jsonp({error: e}))
})

router.get('/:username/favorites/:id', function(req, res){
  User.getUserFavorites(req.params.username)
    .then(result => {
      const check = result.favorites.some((fav) => fav.id === req.params.id)
      res.status(200).jsonp(check)
    }).catch(e => res.status(500).jsonp({error: e}))
})
  
module.exports = router;