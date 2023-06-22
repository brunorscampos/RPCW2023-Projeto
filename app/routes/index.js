var express = require('express');
const querystring = require('querystring');
var router = express.Router();
var acordaoController = require('../controllers/acordao')
var acordaoModel = require('../models/acordao').acordaoModel
var taxonomiaModel = require('../models/taxonomia').taxonomiaModel
var jwt = require('jsonwebtoken')
var axios = require('axios')
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

function verificaAcesso(req, res, next){
  var myToken = req.query.token || req.body.token || req.cookies.token
  if(myToken){
    jwt.verify(myToken, "TPRPCW", function(e, payload){
      console.log("payload no verifica acesso")
      console.log(payload)
      if(e){ 
        //res.status(401).jsonp({error: e})
        req.authStatus = 'invalid'
        next()
      }
      else{
        req.authStatus = payload
        req.user = payload
        next()
      }
    })
  }
  else{
    //res.status(401).jsonp({error: "Token inexistente!"})
    req.authStatus = 'not logged'
    next()
  }
}

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
          descritoresList = (taxonomia2) ? taxonomia2.acordaos : []
          next();
        })
        .catch(erro => {
            console.error('Error retrieving taxonomia2:', erro);
            res.status(500).jsonp({ error: 'Internal server error' });
        });
      }
      else{
        descritoresList = (taxonomia) ? taxonomia.acordaos : []
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
router.get('/', verificaAcesso ,function(req, res, next) {
  res.redirect('/acordaos')
});

/* GET acordaos page. */
router.get('/acordaos', checkTaxonomy, verificaAcesso, function(req, res, next) {
  var data = new Date().toISOString().substring(0, 16)
  var tribunal = (req.query.tribunal) ? ((typeof req.query.tribunal === 'string') ? [req.query.tribunal] : req.query.tribunal) : []
  const keywords = req.query.keywords
  const processo = req.query.processo
  const relator = req.query.relator
  const descritores = req.query.descritores
  const date_start = req.query.date_start
  const date_end = req.query.date_end
  console.log(req.authStatus)
  res.render('index', {d: data,query:querystring.stringify(req.query),tribunais:tribunais,
    tribunal:tribunal,keywords:keywords,processo:processo,relator:relator,
    descritores:descritores,date_start:date_start,date_end:date_end, status: req.authStatus});
});

/* GET acordao info page. */
router.get('/acordaos/:id', verificaAcesso, function(req, res, next) {
  var data = new Date().toISOString().substring(0, 16)
  var id = decodeURIComponent(req.params.id)
  acordaoController.getAcordao(id)
    .then(acord => {
      if (req.authStatus!='not logged' && req.authStatus!='invalid'){
        axios.get('http://localhost:4444/users/' + req.user.username + '/favorites/' + id)
          .then(response => {
            res.render('acordao', { acord:acord.toObject(), d: data, status: req.authStatus, inFav: response.data});
          })
          .catch(e => {
            res.render('error', {error: e, status: req.authStatus})
          }) 
      }
      else{
        res.render('acordao', { acord:acord.toObject(), d: data, status: req.authStatus});
      }
    })
    .catch(erro => {
      res.render('error', {error: erro, message: "Erro na obtenção do acordao", status: req.authStatus})
    })
});

/* GET JQuery DataTable acordaos. */
router.get('/api/acordaos', verificaAcesso, function(req, res, next) {
  const start = parseInt(req.query.start) || 0
  const pageSize = parseInt(req.query.length) || 10
  //const sortField = req.query.sortField || 'Processo';
  //const sortOrder = req.query.sortOrder || 'asc';
  var tribunal = req.query.tribunal
  const keywords = req.query.keywords
  const processo = req.query.processo
  const relator = req.query.relator
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
  if (descritores) {
    if (descritores.length == 0) res.jsonp({recordsTotal: 0,recordsFiltered: 0,start: 1,length: pageSize,data: []});
    filter.url = { $in: descritores }
  }
  if (date_start) filter["Data do Acordão"] = { $gt: date_start }
  if (date_end) {
    if (filter["Data do Acordão"]) filter["Data do Acordão"].$lt = date_end
    else filter["Data do Acordão"] = { $lt: date_end }
  }
  
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

router.post('/api/insert', verificaAcesso, function(req, res, next) {
  if (req.user.level == "admin") {
    const entryData = req.body;
    const newEntry = new acordaoModel(entryData);

    newEntry.save((error) => {
      if (error) {
        // Validation failed or other error occurred, return an error response
        return res.status(400).json({ error: error.message });
      }
      // Entry saved successfully
      return res.status(201).json({ message: 'Entry saved successfully' });
    });
  }else{
    return res.status(403).json({ error: 'Forbidden. User does not have permission.' });
  }
});

/* GET login page. */
router.get('/login', verificaAcesso ,function(req, res, next) {
  var data = new Date().toISOString().substring(0, 16)
  res.render('login', {status: req.authStatus, d: data})
});

/* GET register page. */
router.get('/register', verificaAcesso ,function(req, res, next) {
  var data = new Date().toISOString().substring(0, 16)
  res.render('register', {status: req.authStatus, d: data })
});

/* POST login. */
router.post('/login', function(req, res) {
  var data = new Date().toISOString().substring(0, 16)
  console.log("login: body")
  console.log(req.body)
  axios.post('http://localhost:4444/users/login?token=' + req.cookies.token, req.body)   
    .then(dados => {
      res.cookie('token', dados.data.token, {
        expires: new Date(Date.now() + '1d'),
        secure: false, // set to true if your using https
        httpOnly: true
      })
      res.redirect('/')
    })
    .catch(e => {
      console.log(e.response)
      if(e.response.status == 401 || e.response.status == 400){
        res.render('login', {message: "Wrong credentials!", status: req.authStatus, d: data})
      }
      else{
        res.render('error', {error: e, status: req.authStatus})
      }
    })
});

/* POST register. */
router.post('/register', function(req, res) {
  var data = new Date().toISOString().substring(0, 16)
  req.body.level = "user"
  console.log(req.body)
  axios.post('http://localhost:4444/users/register', req.body)
    .then(dados => {
        res.redirect("/login")
    })
    .catch(e => {
      console.log(e)
      if(e.response.data.message){
        res.render('register', {message: e.response.data.message, status: req.authStatus, d: data});
      }
      else{
        res.render('error', {error: e, status: req.authStatus})
      }
    }) 
});

/* GET logout. */
router.get('/logout', function(req, res) {
  res.clearCookie('token');
  res.redirect('/acordaos');
});

/* GET favorites. */
router.get('/favorites', verificaAcesso, function(req, res) {
  var data = new Date().toISOString().substring(0, 16)
  axios.get('http://localhost:4444/users/' + req.user.username + '/favorites')
    .then(response => {
      var favorites = response.data.favorites
      res.render('favorites', {favorites:favorites, d: data})
    })
    .catch(e => {
      res.render('error', {error: e, status: req.authStatus})
    }) 
});

/* POST add favorite. */
router.post('/favorites/add', verificaAcesso, function(req, res) {
  console.log(req.body)
  axios.post('http://localhost:4444/users/' + req.user.username + '/favorites/add', req.body)
    .then(dados => {
        res.redirect("/")
    })
    .catch(e => {
      res.render('error', {error: e, status: req.authStatus})
    }) 
});

/* POST remove favorite. */
router.post('/favorites/remove', verificaAcesso, function(req, res) {
  console.log(req.body)
  axios.post('http://localhost:4444/users/' + req.user.username + '/favorites/remove', req.body)
    .then(dados => {
        res.redirect("/")
    })
    .catch(e => {
      res.render('error', {error: e, status: req.authStatus})
    }) 
});

module.exports = router;