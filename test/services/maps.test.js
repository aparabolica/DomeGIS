'use strict';

var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = require('assert');
var token;

// Configure Chai
chai.use(chaiHttp);
var should = chai.should();

describe('maps service', function () {

  // setup client
  before(function (done) {
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

  it('is registered as a service', function() {
    assert.ok(app.service('maps'));
  });

  it('create a resource', function(done) {
    var map1 = {
      title: 'Title 1',
      description: 'Description of analysis 1',
      baseLayer: 'Base layer id',
      language: 'pt',
      scrollWheelZoom: false,
      widgets: [{text: 'some analysis'}],
      layers: [
        {layerId: 'layerId1', viewId: 'viewId1'},
        {layerId: 'layerId1', viewId: 'viewId2'}
      ]
    }

    chai.request(app)
      .post('/maps')
      .set('Authorization', 'Bearer '.concat(token))
      .send(map1)
      .end(function (err, res) {
        if (err) console.log(err);

        should.not.exist(err);

        res.body.should.have.property('id');
        res.body.should.have.property('title', map1.title);
        res.body.should.have.property('description', map1.description);
        res.body.should.have.property('baseLayer', map1.baseLayer);
        res.body.should.have.property('language', map1.language);
        res.body.should.have.property('scrollWheelZoom', map1.scrollWheelZoom);
        res.body.should.have.property('widgets').which.has.length(1);
        res.body.should.have.property('layers').which.has.length(2);

        done();
    });
  });
});
