const mongoose = require('mongoose')

var favoriteSchema = new mongoose.Schema({
  descricao: String,
  id: String,
  Processo: String,
  tribunal: String,
  Relator: String,
  'Data do Acordão': String,
  'Área Temática': String,
  'Área Temática 1': String,
  'Área Temática 2': String,
  Descritores: String,
  'Sumário': String
});

var userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    name: String,
    email: { type: String, required: false},
    level: String,
    dateCreated: String,
    lastAccessDate: String,
    favorites: [favoriteSchema]
  });

module.exports = mongoose.model('user', userSchema)