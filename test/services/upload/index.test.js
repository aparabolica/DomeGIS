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

  var sampleRasterLayerId;

  it('should post a file', function(done) {
    this.timeout(20000);

    chai.request(app)
      .post('/uploads')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer '.concat(token))
      .field('name', 'Uploaded layer')
      .attach('file', fs.readFileSync(__dirname + '/../../../fixtures/raster_simple.tif'), 'sample.tif')
      .end(function (err, res) {
        if (err) console.log(err);

        should.not.exist(err);

        res.body.should.not.have.property('id');
        res.body.should.not.have.property('uri');
        res.body.should.not.have.property('size');
        res.body.should.have.property('layer');

        var layer = res.body.layer;
        layer.should.have.property('name', 'Uploaded layer');
        layer.should.have.property('type', 'raster');
        layer.should.have.property('source', 'uploaded');

        layer.should.have.property('sync');
        var sync = layer.sync;
        sync.should.have.property('status', 'importing');
        sync.should.have.property('startedAt');
        sync.should.not.have.property('finishedAt');

        sampleRasterLayerId = layer.id;

        setTimeout(done, 10000);
      });
  });

  it('should change layer status whem import is finished', function(done){
    chai.request(app)
      .get('/layers/' + sampleRasterLayerId)
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer '.concat(token))
      .end(function (err, res) {

        if (err) console.log(err);

        should.not.exist(err);

        var layer = res.body;
        layer.should.have.property('name', 'Uploaded layer');
        layer.should.have.property('type', 'raster');
        layer.should.have.property('source', 'uploaded');

        layer.should.have.property('sync');
        var sync = layer.sync;
        sync.should.have.property('status', 'imported');
        sync.should.have.property('startedAt');
        sync.should.have.property('finishedAt');

        done();
      });
  });

});
