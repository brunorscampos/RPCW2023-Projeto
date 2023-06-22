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

module.exports.getAcordao = id => {
    return Acordao.findOne({_id:id})
        .then(acordao => {
            return acordao
        })
        .catch(erro => {
            return erro
        })
}

module.exports.addAcordao = a => {
    return Acordao.create(a)
        .then(Acordao => {
            return Acordao
        })
        .catch(erro => {
            return erro
        })
}

module.exports.deleteAcordao = id => {
    return Acordao.deleteOne({_id:id})
        .then(Acordao => {
            return Acordao
        })
        .catch(erro => {
            return erro
        })
}