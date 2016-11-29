'use strict';

var fs = require('fs');
var async = require('async');
var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = require('assert');
var app = require('../../../src/app');
var token;

// Configure Chai
chai.use(chaiHttp);
var should = chai.should();

// Test configuration
var IMPORT_FILE_TIMEOUT = 10000; // miliseconds

// Test data
var sampleRaster1LayerId;

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

  // it('registered the uploads service', function() {
  //   assert.ok(app.service('uploads'));
  // });

  it('should post a file', function(done) {
    this.timeout(30000);

    chai.request(app)
      .post('/uploads')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer '.concat(token))
      .field('name', 'Uploaded layer')
      .attach('file', fs.readFileSync(__dirname + '/../../../fixtures/uploads/sample-shapefile-points.shp.zip'), 'sample-shapefile-points.shp.zip')
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

        sampleRaster1LayerId = layer.id;

        setTimeout(done, IMPORT_FILE_TIMEOUT);
      });
  });

  it('should change layer status whem import is finished', function(done){
    chai.request(app)
      .get('/layers/' + sampleRaster1LayerId)
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