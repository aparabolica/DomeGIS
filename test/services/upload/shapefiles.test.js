'use strict';

var fs = require('fs');
var async = require('async');
var moment = require('moment');
var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = require('assert');
var token;

// chai
chai.use(chaiHttp);
var should = chai.should();

// local variables
var layersService;
var layer1;

describe('shapefile upload service', function () {

  // setup client
  before(function (done) {

    // get layers service
    layersService = app.service('layers');

    // login as admin
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

  it('registered the uploads service', function() {
    assert.ok(app.service('uploads'));
  });

  it('should post a file', function(doneIt) {
    this.timeout(30000);

    // create a listener for changes
    var checkResults = function(layer){

      var sync = layer.sync;

      if (sync.status == 'running') return;

      // verify results
      try {

        layer.should.have.property('id', layer1.id);
        layer.should.have.property('fields');
        layer.should.have.property('extents');

        sync.should.have.property('status', 'imported');
        sync.should.have.property('startedAt');
        sync.should.have.property('finishedAt');
        sync.should.not.have.property('message');

        moment(sync.startedAt).diff(layer1.sync.startedAt).should.be.equal(0);
        moment(sync.finishedAt).diff(layer1.sync.finishedAt).should.not.be.equal(0);

        doneIt();

      } catch (e) {
        doneIt(e);
      } finally {
        layersService.removeListener('patched', checkResults);
      }
    }

    // register listener
    layersService.on('patched', checkResults);

    // send the request
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
        layer.should.have.property('type', 'vector');
        layer.should.have.property('source', 'uploaded');

        var sync = layer.sync;
        sync.should.have.property('status', 'importing');
        sync.should.have.property('startedAt');
        sync.should.not.have.property('finishedAt');

        layer1 = layer;
      });
  });

});
