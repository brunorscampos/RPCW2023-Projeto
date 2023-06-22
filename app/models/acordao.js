var mongoose = require('mongoose')

var acordaoSchema = new mongoose.Schema({
    Processo : String,
    "Nº convencional" : String,
    Relator : String,
    Descritores : [String],
    "Nº de documento" : String,
    Apenso : String,
    "Data do Acórdão" : String,
    "Data da decisão sumária" : String,
    "Nº único do projeto" : String,
    Votação : String,
    "Referência de publicação" : String,
    tribunal : String,
    "Processo no tribunal de recurso" : String,
    Data : String,
    "Texto integral" : String,
    Recurso : String,
    "Referência processo" : String,
    Privacidade : String,
    "Meio processual" : String,
    Decisão : String,
    "Indicações eventuais" : String,
    "Área temática" : String,
    "Legislação nacional" : String,
    "Legislação comunitária" : String,
    "Legislação estrangeira" : String,
    "Jurisprudência nacional" : String,
    "Jurisprudência internacional" : String,
    "Jurisprudência estrangeira" : String,
    Sumário : String,
    "Decisão texto integral" : String
})

var acordaoModel = mongoose.model('acordao',acordaoSchema)

module.exports.acordaoModel = acordaoModel