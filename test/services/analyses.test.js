'use strict';

var moment = require('moment');
var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = require('assert');
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

    // get analyses service
    analysesService = app.service('analyses');

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

  it('service is defined', function(doneIt) {
    assert.ok(analysesService);
    doneIt();
  });

  it('post analysis1', function(doneIt) {

    // define a listener to check results
    var checkCreateAnalysis1 = function(analysis){
      if (analysis.task.status == 'running') return;

      // catch errors inside the listener
      try {
        analysis.should.have.property('results');
        var results = analysis.results;
        for (var i = 0; i < 10; i++) {
          var row = results[i];
          row.should.have.property('id', i + 1 );
          row.should.have.property('text_value');
          row.should.have.property('numeric_value');
        }

        // keep results to compare later
        analysis1 = analysis;

        doneIt();
      } catch (e) {
        doneIt(e);
      } finally {
        analysesService.removeListener('patched', checkCreateAnalysis1);
      }
    }

    // register listener
    analysesService.on('patched', checkCreateAnalysis1);

    // send the request
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

    });
  });

  it('post an invalid analysis2', function(doneIt) {

    // define a listener to check results
    var verifyPatchEvent = function(analysis){
      var task = analysis.task;

      if (task.status == 'running') return;

      // catch errors inside the listener
      try {

        analysis.should.have.property('id', analysis2.id);
        analysis.should.have.property('results', null);

        task.should.have.property('status', 'failed');
        task.should.have.property('startedAt');
        task.should.have.property('finishedAt');
        task.should.have.property('message', 'syntax error at or near "Invalid"');


        // keep results to compare later
        analysis2 = analysis;

        doneIt();
      } catch (e) {
        doneIt(e);
      } finally {
        analysesService.removeListener('patched', verifyPatchEvent);
      }
    }

    // register listener
    analysesService.on('patched', verifyPatchEvent);

    // send the request
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

        analysis2 = res.body

    });
  });

  it('start re-execution for analysis2 by setting different query', function(doneIt){

    should.exist(analysis2);

    // define a listener to check results
    var checkReexecution = function(analysis){

      var task = analysis.task;

      if (task.status == 'running') return;

      // catch errors inside the listener
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
        analysesService.removeListener('patched', checkReexecution);
      }
    }

    // register listener
    analysesService.on('patched', checkReexecution);

    // send the request
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
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');

        // verify task status
        res.body.should.have.property('task');
        var task = res.body.task;
        task.should.have.property('status', 'running');
        task.should.have.property('startedAt');
        task.should.not.have.property('finisheddAt');

    });
  });

  it('start re-execution for analysis2 by passing forceExecution=true', function(doneIt){

    // create a listener for analyses changes
    var checkReexecution = function(analysis){

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
        analysesService.removeListener('patched', checkReexecution);
      }
    }

    // register listener
    analysesService.on('patched', checkReexecution);

    // send resquest
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
    });
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
