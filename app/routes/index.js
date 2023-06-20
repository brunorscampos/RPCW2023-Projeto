var express = require('express');
const querystring = require('querystring');
var router = express.Router();
var acordaoController = require('../controllers/acordao')
var acordaoModel = require('../models/acordao').acordaoModel
var userModel = require('../models/users').userModel
var passport = require('passport')
var jwt = require('jsonwebtoken')

function verificaAcesso(req, res, next){
  var myToken = req.query.token || req.body.token
  if(myToken){
    jwt.verify(myToken, "tprpcw", function(e, payload){
      if(e){ 
        //res.status(401).jsonp({error: e})
        req.authStatus = false
        next()
      }
      else{
        req.authStatus = true
        next()
      }
    })
  }
  else{
    //res.status(401).jsonp({error: "Token inexistente!"})
    req.authStatus = false
    next()
  }
}



/* GET home page. */
router.get('/', verificaAcesso, function(req, res, next) {
  res.redirect('/acordaos')
});

/* GET page. */
router.get('/acordaos', verificaAcesso, function(req, res, next) {
  var data = new Date().toISOString().substring(0, 16)
  var tribunais = [{key:'atco1',nome:'Acordão do Tribunal Constitucional'},
                    {key:'jcon',nome: 'Tribunal dos Conflitos'},
                    {key:'jdgpj',nome: 'Direção-Geral da Política de Justiça'},
                    {key:'jsta',nome: 'Supremo Tribunal Administrativo'},
                    {key:'jstj',nome: 'Supremo Tribunal de Justiça'},
                    {key:'jtca',nome: 'Tribunal Central Administrativo'},
                    {key:'jtcampca',nome: 'Tribunal Central Administrativo - Contencioso Administrativo'},
                    {key:'jtcampct',nome: 'Tribunal Central Administrativo - Contencioso Tributário'},
                    {key:'jtcn',nome: 'Tribunal Central Administrativo Norte'},
                    {key:'jtrc',nome: 'Tribunal da Relação de Coimbra'},
                    {key:'jtre',nome: 'Tribunal da Relação de Évora'},
                    {key:'jtrg',nome: 'Tribunal da Relação de Guimarães'},
                    {key:'jtrl',nome: 'Tribunal da Relação de Lisboa'},
                    {key:'jtrp',nome: 'Tribunal da Relação de Porto'}]
  res.render('index', {d: data,query:querystring.stringify(req.query),tribunais:tribunais});
});

/* GET acordao info page. */
router.get('/acordaos/:tribunal/:processo', verificaAcesso, function(req, res, next) {
  var data = new Date().toISOString().substring(0, 16)
  var processo = decodeURIComponent(req.params.processo)
  acordaoController.getAcordao(processo)
    .then(acord => {
      res.render('acordao', { acord:acord.toObject(), d: data });
    })
    .catch(erro => {
      res.render('error', {error: erro, message: "Erro na obtenção dos acordaos"})
    })
});

router.get('/api/acordaos', verificaAcesso, function(req, res, next) {
  const page = parseInt(req.query.start) || 1;
  const pageSize = parseInt(req.query.length) || 25;
  //const sortField = req.query.sortField || 'Processo';
  //const sortOrder = req.query.sortOrder || 'asc';
  const tribunal = req.query.tribunal
  const keywords = req.query.keywords
  const date_start = req.query.date_start
  const date_end = req.query.date_end
  var filter = {}
  if (tribunal) filter.tribunal = tribunal
  if (keywords) filter.$text = { $search: keywords }
  if (date_start) filter["Data do Acordão"] = { $gt: date_start }
  if (date_end) {
    if (filter["Data do Acordão"]) filter["Data do Acordão"].$lt = date_end
    else filter["Data do Acordão"] = { $lt: date_end }
  }
  var projection = {Processo: 1,tribunal: 1,Relator: 1,"Data do Acordão":1,"Área Temática":1,
                    "Área Temática 1":1,"Área Temática 2":1,Descritores:1,Sumário:1}

  acordaoModel.estimatedDocumentCount(filter).then(recordsTotal =>{
    const skip = (page - 1) * pageSize;
    const limit = pageSize;
    acordaoModel.find(filter,projection)//.sort({ [sortField]: sortOrder })
                .skip(skip).limit(limit).then(acordaos => {
      const response = {
        recordsTotal: recordsTotal,
        recordsFiltered: recordsTotal,
        start: page,
        length: pageSize,
        data: acordaos,
      };
      res.jsonp(response);
    }).catch(erro => {
      console.error('Error retrieving acordaos:', erro);
      res.status(500).jsonp({ error: 'Internal server error' });
    });
  }).catch(erro => {
    console.error('Error retrieving acordaos:', erro);
    res.status(500).jsonp({ error: 'Internal server error' });
  });
});

module.exports = router;
