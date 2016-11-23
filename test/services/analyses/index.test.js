'use strict';

// var fs = require('fs');
var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = require('assert');
var app = require('../../../src/app');
var token;

// Configure Chai
chai.use(chaiHttp);
var should = chai.should();

// Test variables
var analysesService;
var analysis1;
var invalidAnalysis;

describe('analyses service', function () {
  this.timeout(5000);

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
    analysesService = app.service('analyses');
    assert.ok(analysesService);
  });

  it('start an analysis', function(done) {
    var query =
      " SELECT                       " +
      " generate_series(1,10) AS id,         " +
      " md5(random()::text) AS text_value,   " +
      " random() * 1000 AS numeric_value;    ";

    chai.request(app)
      .post('/analyses')
      .set('Authorization', 'Bearer '.concat(token))
      .send({
        title: 'Title 1',
        description: 'Description of analysis 1',
        query: query
      })
      .end(function (err, res) {
        if (err) console.log(err);

        should.not.exist(err);

        res.body.should.have.property('id');
        res.body.should.have.property('title');
        res.body.should.have.property('description');
        res.body.should.have.property('query');
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');

        // verify task status
        res.body.should.have.property('task');
        var task = res.body.task;
        task.should.have.property('status', 'running');
        task.should.have.property('startedAt');
        task.should.not.have.property('finisheddAt');

        // keep results to compare later
        analysis1 = res.body;

        done();

    });
  });

  it('analysis task is finished successfully', function(done){

    var checkFinishedSuccessfully = function(analysis){
      if (analysis.task.status == 'running') return;

      // verify results
      try {
        analysis.should.have.property('results');
        var results = analysis.results;
        for (var i = 0; i < 10; i++) {
          var row = results[i];
          row.should.have.property('id', i + 1 );
          row.should.have.property('text_value');
          row.should.have.property('numeric_value');
        }
        done();
      } catch (e) {
        done(e);
      } finally {
        analysesService.removeListener('patched', checkFinishedSuccessfully);
      }
    }

    // wait tasks completion
    analysesService.on('patched', checkFinishedSuccessfully);
  });


  it('start an invalid analysis', function(done) {
    var query = "Invalid SQL query";

    chai.request(app)
      .post('/analyses')
      .set('Authorization', 'Bearer '.concat(token))
      .send({
        title: 'Title 1',
        description: 'Description of analysis 1',
        query: query
      })
      .end(function (err, res) {
        if (err) console.log(err);

        should.not.exist(err);

        res.body.should.have.property('id');
        res.body.should.have.property('title');
        res.body.should.have.property('description');
        res.body.should.have.property('query');
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');

        // verify task status
        res.body.should.have.property('task');
        var task = res.body.task;
        task.should.have.property('status', 'running');
        task.should.have.property('startedAt');
        task.should.not.have.property('finisheddAt');

        // keep results to compare later
        invalidAnalysis = res.body;

        done();

    });
  });

  it('analysis task is finished successfully', function(done){


    var checkTaskIsFailed = function(analysis){
      var task = analysis.task;

      if (task.status == 'running') return;

      // verify results
      try {

        analysis.should.have.property('id', invalidAnalysis.id);
        analysis.should.have.property('results', null);

        task.should.have.property('status', 'failed');
        task.should.have.property('startedAt');
        task.should.have.property('finishedAt');
        task.should.have.property('message', 'syntax error at or near "Invalid"');

        done();
      } catch (e) {
        done(e);
      } finally {
        analysesService.removeListener('patched', checkTaskIsFailed);
      }
    }

    // wait tasks completion
    analysesService.on('patched', checkTaskIsFailed);
  });

});
