var Taxonomia = require('../models/taxonomia').taxonomiaModel

// NAO ESTA A SER UTILIZADA (Tratado pela JQuery DataTable) !!!
module.exports.list = () => {
    return Taxonomia.find()
        .then(docs => {
            return docs
        })
        .catch(erro => {
            return erro
        })
}

// NAO ESTA A SER UTILIZADA (Tratado pela JQuery DataTable) !!!
module.exports.getTaxonomiaPage = (filter,page,perPage) => {
    // return Taxonomia.find(filter,{Processo:1,tribunal:1,url:1}).skip(perPage*(page-1)).limit(perPage)
    rest = [{$project: {Processo: 1,tribunal: 1,url: 1}},{$skip: perPage * (page - 1)},{$limit: perPage}]
    return Taxonomia.aggregate([...filter, ...rest])
        .then(docs => {
            return docs
        })
        .catch(erro => {
            return erro
        })
}

module.exports.getTaxonomia = (name,parent) => {
    filter = {name:name}
    if (parent) filter.parent = parent
    return Taxonomia.findOne(filter)
        .then(taxonomia => {
            return taxonomia
        })
        .catch(erro => {
            return erro
        })
}