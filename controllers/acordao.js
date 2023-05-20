var Acordao = require('../models/acordao').acordaoModel

// NAO ESTA A SER UTILIZADA (Tratado pela JQuery DataTable) !!!
module.exports.list = () => {
    return Acordao.find()
        .then(docs => {
            return docs
        })
        .catch(erro => {
            return erro
        })
}

// NAO ESTA A SER UTILIZADA (Tratado pela JQuery DataTable) !!!
module.exports.getAcordaoPage = (filter,page,perPage) => {
    // return Acordao.find(filter,{Processo:1,tribunal:1,url:1}).skip(perPage*(page-1)).limit(perPage)
    rest = [{$project: {Processo: 1,tribunal: 1,url: 1}},{$skip: perPage * (page - 1)},{$limit: perPage}]
    return Acordao.aggregate([...filter, ...rest])
        .then(docs => {
            return docs
        })
        .catch(erro => {
            return erro
        })
}

module.exports.getAcordao = processo => {
    return Acordao.findOne({Processo:processo})
        .then(acordao => {
            return acordao
        })
        .catch(erro => {
            return erro
        })
}