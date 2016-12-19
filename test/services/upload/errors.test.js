'use strict';

var fs = require('fs');
// var async = require('async');
// var moment = require('moment');
var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = require('assert');
var token;

// chai
chai.use(chaiHttp);
var should = chai.should();

describe('invalid files in uploads service', function () {

  // setup client
  before(function (done) {

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

  it('file is corrupt');

  it('invalid file format', function(doneIt){

    chai.request(app)
      .post('/uploads')
      .set('Accept', 'application/json')
      .set('Authorization', 'Bearer '.concat(token))
      .field('name', 'Uploaded layer')
      .attach('file', fs.readFileSync(__dirname + '/../../../fixtures/uploads/sample.geojson'), 'sample.geojson')
      .end(function (err, res) {
        should.exist(err);

        // should not create a new layer
        res.body.should.not.have.property('id');
        res.body.should.not.have.property('uri');
        res.body.should.not.have.property('size');
        res.body.should.not.have.property('layer');

        // error message should be properly formed
        res.should.have.status(400);
        res.body.should.have.property('name', 'BadRequest');
        res.body.should.have.property('message', 'Unsupported file format');

        doneIt();
      });
  });
});
