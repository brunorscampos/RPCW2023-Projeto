var mongoose = require('mongoose')

var acordaoSchema = new mongoose.Schema({
    // ...
})

var acordaoModel = mongoose.model('acordao',acordaoSchema)

module.exports.acordaoModel = acordaoModel