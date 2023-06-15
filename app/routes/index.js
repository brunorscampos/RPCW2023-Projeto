var express = require('express');
const querystring = require('querystring');
var router = express.Router();
var acordaoController = require('../controllers/acordao')
var acordaoModel = require('../models/acordao').acordaoModel

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/acordaos')
});

/* GET page. */
router.get('/acordaos', function(req, res, next) {
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
router.get('/acordaos/:tribunal/:processo', function(req, res, next) {
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

router.get('/api/acordaos', function(req, res, next) {
  const start = parseInt(req.query.start) || 0
  const pageSize = parseInt(req.query.length) || 10
  //const sortField = req.query.sortField || 'Processo';
  //const sortOrder = req.query.sortOrder || 'asc';
  var tribunal = req.query.tribunal
  const keywords = req.query.keywords
  const processo = req.query.processo
  const relator = req.query.relator
  const descritores = req.query.descritores
  const date_start = req.query.date_start
  const date_end = req.query.date_end

  var filter = {}
  var projection = {Processo: 1,tribunal: 1,Relator: 1,"Data do Acordão":1,"Área Temática":1,
                    "Área Temática 1":1,"Área Temática 2":1,Descritores:1,Sumário:1}

  if (tribunal){
    if (typeof tribunal === 'string') tribunal = [tribunal]
    filter.tribunal = {$in: tribunal}
  }
  if (keywords) {
    const searchkeywords = keywords.split(" ").map(word => `"${word}"`).join(" ");
    filter.$text = { $search: searchkeywords, $language: "pt" }
  }
  if (processo) filter.Processo = { $regex: processo, $options: 'i' }
  if (relator) {
    var relatorRegexConditions = relator.split(" ").map(function(word) {
      return { Relator: { $regex: word, $options: 'i' } };
    });
    filter.$and = relatorRegexConditions 
  }
  if (descritores) {
    var descritoresRegexConditions = descritores.split(" ").map(function(word) {
      return { Descritores: { $regex: word, $options: 'i' } };
    });
    filter.$and = descritoresRegexConditions 
  }
  if (date_start) filter["Data do Acordão"] = { $gt: date_start }
  if (date_end) {
    if (filter["Data do Acordão"]) filter["Data do Acordão"].$lt = date_end
    else filter["Data do Acordão"] = { $lt: date_end }
  }

  console.log(filter)
  console.log(projection)
  
  acordaoModel.estimatedDocumentCount(filter).then(recordsTotal =>{
    const skip = start
    const limit = pageSize
    const page = (skip / limit) + 1 
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
