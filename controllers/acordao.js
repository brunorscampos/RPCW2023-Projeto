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

module.exports.getAcordao = id => {
    return Acordao.acordaoModel.findOne({id:id})
        .then(acordao => {
            return acordao
        })
        .catch(erro => {
            return erro
        })
}