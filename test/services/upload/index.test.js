'use strict';

var fs = require('fs');
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
    chai.request(app)
      .post('/uploads')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer '.concat(token))
      .attach('file', fs.readFileSync(__dirname + '/../../../fixtures/uploads/sample.tiff'), 'sample.tif')
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.property('id');
        res.body.id.should.equal('8b791d2ef3366fbdc30cdcafaf808778b2aa0e090475d43028a8dd2909a7f944.tiff');
        res.body.should.not.have.property('uri');
        res.body.should.have.property('size', 4009155);
        done();
      });
  });
});
