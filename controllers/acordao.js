var Acordao = require('../models/acordao')

// Acordao list
module.exports.list = () => {
    return Acordao.acordaoModel.find()
        .then(docs => {
            return docs
        })
        .catch(erro => {
            return erro
        })
}

module.exports.getAcordaoPage = (filter,page) => {
    return Acordao.acordaoModel.find({},{Processo:1,tribunal:1,url:1}).skip(20*(page-1)).limit(20)
        .then(docs => {
            return docs
        })
        .catch(erro => {
            return erro
        })
}

module.exports.getAcordao = processo => {
    return Acordao.acordaoModel.findOne({Processo:processo})
        .then(acordao => {
            return acordao
        })
        .catch(erro => {
            return erro
        })
}