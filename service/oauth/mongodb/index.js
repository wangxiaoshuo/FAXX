/** https://github.com/dsquier/oauth2-server-php-mysql **/
var config = require('../config.js')
var mongoose = require('mongoose');

mongoose.Promise = global.Promise
var connection = mongoose.createConnection(config.mongo.uri, {
  auth: {authdb: config.mongo.authdb},
  mongos: config.mongo.mongos
});
connection.on('error', function (err) {
  if (err) return console.log(err);
  console.log('Mongoose Connected: ' + config.mongo.uri);
});

var db ={};
// db.OAuthAccessToken = require('./OAuthAccessToken')
// db.OAuthAuthorizationCode = require('./OAuthAuthorizationCode')
// db.OAuthClient = require('./OAuthClient')
// db.OAuthRefreshToken = require('./OAuthRefreshToken')
// db.OAuthScope = require('./OAuthScope')
// db.User = require('./User')
// db.Thing = require('./Thing')

// If you create a custom connection, use that connection's model() function instead.
db.OAuthAccessToken = connection.model('OAuthAccessToken', require('./OAuthAccessToken'));
db.OAuthAuthorizationCode = connection.model('OAuthAuthorizationCode', require('./OAuthAuthorizationCode'));
db.OAuthClient = connection.model('OAuthClient', require('./OAuthClient'));
db.OAuthRefreshToken = connection.model('OAuthRefreshToken', require('./OAuthRefreshToken'));
db.OAuthScope = connection.model('OAuthScope', require('./OAuthScope'));
db.User = connection.model('User', require('./User'));
db.Thing = connection.model('Thing', require('./Thing'));

module.exports = db;