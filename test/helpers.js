'use strict';

// init app (if not done already)
before(function(doneBefore){
  var self = this;
  self.timeout(30000);

  if (global.app) doneBefore();
  else {
    global.app = require('../src/app');
    self.server = app.listen(3030);
    self.server.once('listening', function() {
      doneBefore();
    });
  }
});
