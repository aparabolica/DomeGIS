var crypto = require('crypto');
var bcrypt = require('bcryptjs');
var errors = require('feathers-errors');
var isEmail = require('validator/lib/isEmail');

var mailgun = require('mailgun-js')({
  apiKey: "key-0fc958ec2e7688a13a35ef627533d629",
  domain: "sandbox72f09106b4d14745884ada5fb8e348ae.mailgun.org"
});

module.exports = function() {
  var app = this;

  var Users = app.service('users');
  var sequelize = app.get('sequelize');

  app.use('/reset', {
    find: function(params){
      return new Promise(function(resolve, reject){
        var email = params.query.email;

        if (email && isEmail(email)) {
          Users.find({ query: { email: email }}).then(function(result){
            if (result.data.length == 0)
              reject(new errors.BadRequest('User does not exist.'));
            else {
              // get user id
              var user = result.data[0];
              var userId = user.id;

              // user exists, generate new password for him
              var newPassword = crypto.randomBytes(10).toString('hex');
              var hash = bcrypt.hashSync(newPassword, 10);

              Users
                .patch(userId, {
                  password: hash
                }, {
                  reset: true
                })
                .then(function(){

                  // send email
                  var data = {
                    from: "DomeGIS <postmaster@sandbox72f09106b4d14745884ada5fb8e348ae.mailgun.org>",
                    to: email,
                    subject: 'New password for DomeGIS',
                    text: 'Your new password for DomeGIS is: ' + newPassword
                  };

                  mailgun.messages().send(data, function (err, body) {
                    if (err) reject(err);
                    else resolve('A new password was sent to your e-mail.');
                  });
                })
                .catch(function(err){
                  console.log('error updating user');
                  console.log(err);
                });
            }
          }).catch(function(err){
            console.log('err');
            console.log(err);
          });
        } else reject(new errors.BadRequest('Missing or invalid e-mail.'));
      });
    }
  });
}
