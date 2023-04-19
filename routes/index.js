var express = require('express');
var router = express.Router();
var Acordao = require('../controllers/acordao')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/acordaos/1')
});

/* GET page. */
router.get('/acordaos/:page', function(req, res, next) {
  var data = new Date().toISOString().substring(0, 16)
  var page = Number(req.params.page)
  if (page >= 1) {
    Acordao.getAcordaoPage({},page)
      .then(acords => {
        res.render('index', { page:page, acords: acords, d: data });
      })
      .catch(erro => {
        res.render('error', {error: erro, message: "Erro na obtenção dos acordaos"})
      })
  }
  else{
    res.render('error', {error: "Invalid Page", message: "Invalid Page"})
  }
});

/* GET acordao info page. */
router.get('/acordaos/:tribunal/:processo', function(req, res, next) {
  var data = new Date().toISOString().substring(0, 16)
  var processo = decodeURIComponent(req.params.processo)
  Acordao.getAcordao(processo)
    .then(acord => {
      res.render('acordao', { acord:acord.toObject(), d: data });
    })
    .catch(erro => {
      res.render('error', {error: erro, message: "Erro na obtenção dos acordaos"})
    })
});

module.exports = router;
