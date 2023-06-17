var mongoose = require('mongoose')

var taxonomiaSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    parent: Number,
    acordaos: [String]
})

var taxonomiaModel = mongoose.model('taxonomia',taxonomiaSchema,'taxonomia')

module.exports.taxonomiaModel = taxonomiaModel