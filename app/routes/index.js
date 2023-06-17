var express = require('express');
const querystring = require('querystring');
var router = express.Router();
var acordaoController = require('../controllers/acordao')
var acordaoModel = require('../models/acordao').acordaoModel
var taxonomiaModel = require('../models/taxonomia').taxonomiaModel
var descritoresList = null

const tribunais = [{key:'atco1',nome:'Acordão do Tribunal Constitucional'},
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

function diacriticInsensitiveRegex(string = '') {
  return string
     .replace(/[AÁÀÃÂaáàäâã]/g, '[AÁÀÃÂaáàäâã]')
     .replace(/[EÉÈÊeéëèê]/g, '[EÉÈÊeéëèê]')
     .replace(/[IÍÌÎiíïìî]/g, '[IÍÌÎiíïìî]')
     .replace(/[OÓÒÕÔoóöòõô]/g, '[OÓÒÕÔoóöòõô]')
     .replace(/[UÚÙÛuüúùû]/g, '[UÚÙÛuüúùû]')
     .replace(/[CÇcç]/g, '[CÇcç]')
}

function checkTaxonomy(req, res, next) {
  const descritores = req.query.descritores
  descritoresList = null;

  var filter = {}
  var projection = {}
  
  if (descritores) {
    const prepositionsRegex = /\b(de|a|do|da|o|ou|e|dos|das|para|por|como|com|em|um|uma|pelo|pela|as|os|ao|desse|no|na|nos|nas|à|às|á|ás|seu|sua|seus|suas|pelos|pelas|sobre|dessa|desses|dessas|NO)\b/gi;
    const descritores_remove_prepos = descritores.replace(prepositionsRegex, '');
    var descritoresRegexConditions = descritores_remove_prepos.split(/\s+/).filter(word => word.length > 0).map(function(word) {
      return diacriticInsensitiveRegex(word);
    });
    filter.name = { $regex: "^" + descritoresRegexConditions[0] + "$", $options: 'i'};
    filter.parent = null

    taxonomiaModel.findOne(filter,projection).then(taxonomia => {
      if (descritoresRegexConditions.length > 1 && taxonomia !== null) {

        var filter2 = {}
        var projection2 = {}

        filter2.name = { $regex: "^" + descritoresRegexConditions[1] + "$", $options: 'i'}
        filter2.parent = taxonomia._id

        taxonomiaModel.findOne(filter2,projection2).then(taxonomia2 => {
          descritoresList = (taxonomia2) ? taxonomia2.acordaos : null
          next();
        })
        .catch(erro => {
            console.error('Error retrieving taxonomia2:', erro);
            res.status(500).jsonp({ error: 'Internal server error' });
        });
      }
      else{
        descritoresList = (taxonomia) ? taxonomia.acordaos : null
        next();
      }
    })
    .catch(erro => {
        console.error('Error retrieving taxonomia:', erro);
        res.status(500).jsonp({ error: 'Internal server error' });
    });
  }
  else next();
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/acordaos')
});

/* GET page. */
router.get('/acordaos', checkTaxonomy, function(req, res, next) {
  var data = new Date().toISOString().substring(0, 16)
  var tribunal = (req.query.tribunal) ? ((typeof req.query.tribunal === 'string') ? [req.query.tribunal] : req.query.tribunal) : []
  const keywords = req.query.keywords
  const processo = req.query.processo
  const relator = req.query.relator
  const descritores = req.query.descritores
  const date_start = req.query.date_start
  const date_end = req.query.date_end
  res.render('index', {d: data,query:querystring.stringify(req.query),tribunais:tribunais,
    tribunal:tribunal,keywords:keywords,processo:processo,relator:relator,
    descritores:descritores,date_start:date_start,date_end:date_end});
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
  //const descritores = req.query.descritores
  const descritores = descritoresList
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
  if (processo) filter.Processo = { $regex: diacriticInsensitiveRegex(processo), $options: 'i' }
  if (relator) {
    var relatorRegexConditions = relator.split(" ").map(function(word) {
      return { Relator: { $regex: diacriticInsensitiveRegex(word), $options: 'i' } };
    });
    filter.$and = relatorRegexConditions 
  }
  /*
  if (descritores) {
    var descritoresRegexConditions = descritores.split(" ").map(function(word) {
      return { Descritores: { $regex: diacriticInsensitiveRegex(word), $options: 'i' } };
    });
    filter.$and = descritoresRegexConditions 
  }
  */
  if (descritores) filter.url = { $in: descritores }
  if (date_start) filter["Data do Acordão"] = { $gt: date_start }
  if (date_end) {
    if (filter["Data do Acordão"]) filter["Data do Acordão"].$lt = date_end
    else filter["Data do Acordão"] = { $lt: date_end }
  }

  console.log(filter)
  console.log(projection)
  
  acordaoModel.estimatedDocumentCount().then(recordsTotal =>{
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
