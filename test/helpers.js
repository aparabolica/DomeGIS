'use strict';

var chai = require('chai');

// init app (if not done already)
before(function(doneBefore){
  var self = this;
  self.timeout(30000);

  if (global.app) doneBefore();
  else {
    global.app = require('../src/app');
    self.server = app.listen(3030);
    self.server.once('listening', function() {

      var remainingAttempts = 5;

      function login() {

        // login as admin and set global token
        chai.request(app)
            .post('/auth/local')
            .set('Accept', 'application/json')
            .send({
               'email': 'admin@domegis',
               'password': 'domegis'
            })
            .end(function (err, res) {
              if ((!err) && (res.body.token)) {
                global.token = 'Bearer ' + res.body.token;
                doneBefore();
              }

              remainingAttempts--;

              if (remainingAttempts > 0) {
                setTimeout(login, 5000);
              } else {
                doneBefore(new Error('Unable to authenticate.'));
              }
            });
      }

      login();

    });
  }
});
