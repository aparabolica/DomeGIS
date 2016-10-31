'use strict';

var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = require('assert');
var app = require('../../../src/app');
var token;

//use http plugin
chai.use(chaiHttp);

//use should
var should = chai.should();

describe('files service', function () {

  // setup client
  before(function (done) {
    this.server = app.listen(3030);
    this.server.once('listening', function() {
      chai.request(app)
          .post('/auth/local')
          .set('Accept', 'application/json')
          .send({
             'email': 'admin@domegis',
             'password': 'domegis'
          })
          .end(function (err, res) {
            should.not.exist(err);
            should.exist(res.body.token);
            token = res.body.token;
            done();
          });
    });
  });

  it('registered the uploads service', function() {
    assert.ok(app.service('uploads'));
  });

  it('should post a file', function(done) {
      //setup a request
      chai.request(app)
          //request to /store
          .post('/uploads')
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer '.concat(token))
          //attach data to request
          .send({
            uri: "data:image/gif;base64,R0lGODlhEwATAPcAAP/+//7/////+////fvzYvryYvvzZ/fxg/zxWfvxW/zwXPrtW/vxXvfrXv3xYvrvYvntYvnvY/ruZPrwZPfsZPjsZfjtZvfsZvHmY/zxavftaPrvavjuafzxbfnua/jta/ftbP3yb/zzcPvwb/zzcfvxcfzxc/3zdf3zdv70efvwd/rwd/vwefftd/3yfPvxfP70f/zzfvnwffvzf/rxf/rxgPjvgPjvgfnwhPvzhvjvhv71jfz0kPrykvz0mv72nvblTPnnUPjoUPrpUvnnUfnpUvXlUfnpU/npVPnqVPfnU/3uVvvsWPfpVvnqWfrrXPLiW/nrX/vtYv7xavrta/Hlcvnuf/Pphvbsif3zk/zzlPzylfjuk/z0o/LqnvbhSPbhSfjiS/jlS/jjTPfhTfjlTubUU+/iiPPokfrvl/Dll/ftovLWPfHXPvHZP/PbQ/bcRuDJP/PaRvjgSffdSe3ddu7fge7fi+zkuO7NMvPTOt2/Nu7SO+3OO/PWQdnGbOneqeneqvDqyu3JMuvJMu7KNfHNON7GZdnEbejanObXnOW8JOa9KOvCLOnBK9+4Ku3FL9ayKuzEMcenK9e+XODOiePSkODOkOW3ItisI9yxL+a9NtGiHr+VH5h5JsSfNM2bGN6rMJt4JMOYL5h4JZl5Jph3Jpl4J5h5J5h3KJl4KZp5Ks+sUN7Gi96lLL+PKMmbMZt2Jpp3Jpt3KZl4K7qFFdyiKdufKsedRdm7feOpQN2QKMKENrpvJbFfIrNjJL1mLMBpLr9oLrFhK69bJFkpE1kpFYNeTqFEIlsoFbmlnlsmFFwpGFkoF/////7+/v///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAANAALAAAAAATABMAAAj/AKEJHCgokKJKlhThGciQYSIva7r8SHPFzqGGAwPd4bKlh5YsPKy0qFLnT0NAaHTcsIHDho0aKkaAwGCGEkM1NmSkIjWLBosVJT6cOjUrzsBKPl54KmYsACoTMmk1WwaA1CRoeM7siJEqmTIAsjp40ICK2bEApfZcsoQlxwxRzgI8W8XhgoVYA+Kq6sMK0QEYKVCUkoVqQwQJFTwFEAAAFZ9PlFy4OEEiRIYJD55EodDA1ClTbPp0okRFxBQDBRgskAKhiRMlc+Sw4SNpFCIoBBwkUMBkCBIiY8qAgcPG0KBHrBTFQbCEV5EjQYQACfNFjp5CgxpxagVtUhIjwzaJYSHzhQ4cP3ryQHLEqJbASnu+6EIW6o2b2X0ISXK0CFSugazs0YYmwQhziyuE2PLLIv3h0hArkRhiCCzAENOLL7tgAoqDGLXSSSaPMLIIJpmAUst/GA3UCiuv1PIKLtw1FBAAOw=="
          })
          //when finished do the following
          .end(function (err, res) {
              res.body.should.have.property('id');
              res.body.id.should.equal('6454364d8facd7a88e627e4c4b11b032d2f83af8f7f9329ffc2b7a5c879dc838.gif');
              res.body.should.have.property('uri');
              res.body.should.have.property('size', 1156);
              done();
          });
  });
});
