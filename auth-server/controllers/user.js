// Controlador para o modelo User

var User = require('../models/user')

// Devolve a lista de Users
module.exports.users = () => {
    return User
        .find()
        .sort('username')
        .exec()
}

module.exports.lookup = uname => {
    return User
        .findOne({username: uname})
        .exec()
}

module.exports.insertUser = u => {
    var novo = new User(u)
    return novo.save()
}

module.exports.removeUser = function(uname){
    return User.deleteOne({username: uname})
}

module.exports.updateUser = function(u){
    return User.findByIdAndUpdate({username: u.username}, u, {new: true})
}

module.exports.getUserFavorites = function(username){
    return User.findOne({username: username}, {_id:0,favorites:1})
}

module.exports.addUserFavorite = function(username,a){
    return User.updateOne({username: username}, { $push: { favorites: a } })
}

module.exports.removeUserFavorite = function(username,a){
    return User.updateOne({username: username}, { $pull: { favorites: { id: a.id } }})
}