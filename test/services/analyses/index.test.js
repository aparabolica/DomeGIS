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

// Test configuration
// var IMPORT_FILE_TIMEOUT = 5000; // miliseconds

// Test data
var analysis1;

describe('analyses service', function () {

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
    assert.ok(app.service('analyses'));
  });

  it('create an analysis', function(done) {
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
        res.body.should.have.property('results');
        res.body.should.have.property('createdAt');
        res.body.should.have.property('executedAt');

        var results = res.body.results;
        for (var i = 0; i < 10; i++) {
          var row = results[i];
          row.should.have.property('id', i + 1 );
          row.should.have.property('text_value');
          row.should.have.property('numeric_value');
        }

        // keep results to compare later
        analysis1 = res.body;

        done();
    });
  });

  it('re-execute analysis', function(done) {

    chai.request(app)
      .patch('/analyses/' + analysis1.id)
      .set('Authorization', 'Bearer '.concat(token))
      .send({
        title: 'Changed title 1',
        description: 'Changed description of analysis 1',
        query: "SELECT 1;"
      })
      .end(function (err, res) {
        if (err) console.log(err);

        should.not.exist(err);

        res.body.should.have.property('id', analysis1.id);
        res.body.should.have.property('title', analysis1.title);
        res.body.should.have.property('description', analysis1.description);
        res.body.should.have.property('query', analysis1.query);
        res.body.should.have.property('createdAt', analysis1.createdAt);
        res.body.should.have.property('executedAt').not.equal(analysis1.executedAt);

        res.body.should.have.property('results');
        var results = res.body.results;
        for (var i = 0; i < 10; i++) {
          var row = results[i];
          row.should.have.property('id', i + 1 );
          row.should.have.property('text_value').not.equal(analysis1.results[i].text_value);
          row.should.have.property('numeric_value').not.equal(analysis1.results[i].numeric_value);
        }
        done();

    });
  });
});
