var Taxonomia = require('../models/taxonomia').taxonomiaModel

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