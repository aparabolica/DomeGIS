'use strict';

var moment = require('moment');
var chai = require('chai');
var chaiHttp = require('chai-http');
    chai.use(chaiHttp);
var should = chai.should();
var assert = require('assert');
var token;

// test data
var layersService;
var layer1;
var validSqlInvalidQuery = "SELECT 1 as numericProperty, 'a' as charProperty;";
var validSqlValidQuery = "SELECT ST_SetSRID(ST_Point(-46.1043441, -23.315067),4326) as geometry, 1 as numericProperty, 'a' as charProperty;";


describe('derived layers service', function () {
  this.timeout(20000);

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

  it('return error when missing a query', function(doneIt) {
    chai.request(app)
      .post('/layers')
      .set('Authorization', 'Bearer '.concat(token))
      .send({
        source: 'derived',
        name: 'Derived layer 1',
        description: 'Description of analysis 1'
      })
      .end(function (err, res) {
        should.exist(err);
        res.body.should.have.property('message', 'Missing SQL query.');
        doneIt()
    });
  });


  it('create a derived layer from a query', function(doneIt) {
    this.timeout(30000);

    // create a listener of changes
    var checkResults = function(layer){

      var sync = layer.sync;

      if (sync.status == 'running') return;

      // verify results
      try {

        layer.should.have.property('id', layer1.id);
        layer.should.have.property('fields');
        layer.should.have.property('extents');

        sync.should.have.property('status', 'ok');
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
      .post('/layers')
      .set('Authorization', 'Bearer '.concat(token))
      .send({
        source: 'derived',
        name: 'Derived layer 1',
        description: 'Description of analysis 1',
        query: validSqlValidQuery
      })
      .end(function (err, res) {
        if (err) console.log(err);

        should.not.exist(err);

        res.body.should.have.property('id');
        res.body.should.have.property('source', 'derived');
        res.body.should.have.property('name');
        res.body.should.have.property('query');
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');

        // verify sync status
        res.body.should.have.property('sync');
        var sync = res.body.sync;
        sync.should.have.property('status', 'running');
        sync.should.have.property('startedAt');
        sync.should.not.have.property('finisheddAt');

        layer1 = res.body;

    });
  });

  it('set status as failed when the query is invalid', function(doneIt) {

    // create a listener of changes
    var checkResults = function(layer){

      var sync = layer.sync;

      if (sync.status == 'running') return;

      // verify results
      try {

        layer.should.have.property('id', layer1.id);
        layer.should.have.property('fields', null);
        layer.should.have.property('extents', null);

        sync.should.have.property('status', 'error');
        sync.should.have.property('startedAt', layer1.sync.startedAt);
        sync.should.have.property('finishedAt');
        sync.should.have.property('message', 'Missing "geometry" field.');

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
      .post('/layers')
      .set('Authorization', 'Bearer '.concat(token))
      .send({
        source: 'derived',
        name: 'Derived layer 1',
        description: 'Description of analysis 1',
        query: validSqlInvalidQuery
      })
      .end(function (err, res) {
        if (err) console.log(err);

        should.not.exist(err);

        res.body.should.have.property('id');
        res.body.should.have.property('source', 'derived');

        res.body.should.have.property('name');
        res.body.should.have.property('query');
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');

        // verify task status
        var sync = res.body.sync;
        sync.should.have.property('status', 'running');
        sync.should.have.property('startedAt');
        sync.should.not.have.property('finisheddAt');

        layer1 = res.body;
    });
  });
});
