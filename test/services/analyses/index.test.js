'use strict';

var moment = require('moment');
var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = require('assert');
var app = require('../../../src/app');
var token;

// Configure Chai
chai.use(chaiHttp);
var should = chai.should();

// Test data
var analysesService;
var analysis1;
var analysis2;
var validQuery =
  " SELECT                       " +
  " generate_series(1,10) AS id,         " +
  " md5(random()::text) AS text_value,   " +
  " random() * 1000 AS numeric_value;    ";
var invalidQuery = "Invalid SQL query";

describe('analyses service', function () {
  this.timeout(20000);

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

  it('post analysis1', function(done) {
    chai.request(app)
      .post('/analyses')
      .set('Authorization', 'Bearer '.concat(token))
      .send({
        title: 'Title 1',
        description: 'Description of analysis 1',
        query: validQuery
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

  it('analysis1 task is finished successfully', function(done){

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

    // await tasks completion
    analysesService.on('patched', checkFinishedSuccessfully);
  });


  it('post an invalid analysis2', function(done) {
    chai.request(app)
      .post('/analyses')
      .set('Authorization', 'Bearer '.concat(token))
      .send({
        title: 'Title 1',
        description: 'Description of analysis 1',
        query: invalidQuery
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
        analysis2 = res.body;

        done();

    });
  });

  it('analysis2 have proper failed status', function(done){

    var checkIfTaskHasFailedStatus = function(analysis){
      var task = analysis.task;

      if (task.status == 'running') return;

      // verify results
      try {

        analysis.should.have.property('id', analysis2.id);
        analysis.should.have.property('results', null);

        task.should.have.property('status', 'failed');
        task.should.have.property('startedAt');
        task.should.have.property('finishedAt');
        task.should.have.property('message', 'syntax error at or near "Invalid"');

        done();
      } catch (e) {
        done(e);
      } finally {
        analysesService.removeListener('patched', checkIfTaskHasFailedStatus);
      }
    }

    // await tasks completion
    analysesService.on('patched', checkIfTaskHasFailedStatus);
  });

  it('start re-execution for analysis2 by setting different query', function(doneIt){
    chai.request(app)
      .patch('/analyses/' + analysis2.id)
      .set('Authorization', 'Bearer '.concat(token))
      .send({
        query: validQuery
      })
      .end(function (err, res) {
        if (err) console.log(err);

        should.not.exist(err);

        res.body.should.have.property('id');
        res.body.should.have.property('title', analysis2.title);
        res.body.should.have.property('description', analysis2.description);
        res.body.should.have.property('query', validQuery);
        res.body.should.have.property('createdAt', analysis2.createdAt);
        res.body.should.have.property('updatedAt');

        // verify task status
        res.body.should.have.property('task');
        var task = res.body.task;
        task.should.have.property('status', 'running');
        task.should.have.property('startedAt');
        task.should.not.have.property('finisheddAt');

        doneIt();
    });
  });

  it('task re-execution should be completed successfully', function(doneIt){

    var listener = function(analysis){
      var task = analysis.task;

      if (task.status == 'running') return;

      // verify results
      try {

        analysis.should.have.property('id', analysis2.id);

        analysis.should.have.property('results');
        var results = analysis.results;
        for (var i = 0; i < 10; i++) {
          var row = results[i];
          row.should.have.property('id', i + 1 );
          row.should.have.property('text_value');
          row.should.have.property('numeric_value');
        }

        task.should.have.property('status', 'finished');
        task.should.not.have.property('message');

        moment(task.startedAt).diff(analysis2.task.startedAt).should.not.be.equal(0);
        moment(task.finishedAt).diff(analysis2.task.finishedAt).should.not.be.equal(0);

        analysis2 = analysis;

        doneIt();

      } catch (e) {
        doneIt(e);
      } finally {
        analysesService.removeListener('patched', listener);
      }
    }

    // await tasks completion
    analysesService.on('patched', listener);

  });

  it('start re-execution for analysis2 by setting forceExecution=true', function(doneIt){
    chai.request(app)
      .patch('/analyses/' + analysis2.id)
      .set('Authorization', 'Bearer '.concat(token))
      .send({
        forceExecution: true
      })
      .end(function (err, res) {
        if (err) console.log(err);

        should.not.exist(err);

        res.body.should.have.property('id');
        res.body.should.have.property('title', analysis2.title);
        res.body.should.have.property('description', analysis2.description);
        res.body.should.have.property('query', validQuery);
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');

        // verify task status
        res.body.should.have.property('task');
        var task = res.body.task;
        task.should.have.property('status', 'running');
        task.should.have.property('startedAt');
        task.should.not.have.property('finisheddAt');

        doneIt();
    });
  });

  it('task re-execution should be completed successfully', function(doneIt){

    var listener = function(analysis){
      var task = analysis.task;

      if (task.status == 'running') return;

      // verify results
      try {

        analysis.should.have.property('id', analysis2.id);

        analysis.should.have.property('results');
        var results = analysis.results;
        for (var i = 0; i < 10; i++) {
          var row = results[i];
          row.should.have.property('id', i + 1 );
          row.should.have.property('text_value');
          row.should.have.property('numeric_value');
        }

        task.should.have.property('status', 'finished');
        task.should.have.property('startedAt');
        task.should.have.property('finishedAt');
        task.should.not.have.property('message');

        moment(task.startedAt).diff(analysis2.task.startedAt).should.not.be.equal(0);
        moment(task.finishedAt).diff(analysis2.task.finishedAt).should.not.be.equal(0);

        analysis2 = analysis;

        doneIt();

      } catch (e) {
        doneIt(e);
      } finally {
        analysesService.removeListener('patched', listener);
      }
    }

    // await tasks completion
    analysesService.on('patched', listener);

  });

  it('patch analysis2 without query re-execution', function(doneIt){
    chai.request(app)
      .patch('/analyses/' + analysis2.id)
      .set('Authorization', 'Bearer '.concat(token))
      .send({
        title: 'new title 2',
        description: 'description 2'
      })
      .end(function (err, res) {
        if (err) console.log(err);

        should.not.exist(err);

        res.body.should.have.property('id');
        res.body.should.have.property('title', 'new title 2');
        res.body.should.have.property('description', 'description 2');
        res.body.should.have.property('query', validQuery);

        // verify task status
        res.body.should.have.property('task');
        var task = res.body.task;
        task.should.have.property('status', 'finished');

        moment(task.startedAt).diff(analysis2.task.startedAt).should.be.equal(0);
        moment(task.finishedAt).diff(analysis2.task.finishedAt).should.be.equal(0);

        doneIt();
    });
  });
});
