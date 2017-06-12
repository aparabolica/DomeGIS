'use strict';

var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = require('assert');
var token;

// Configure Chai
chai.use(chaiHttp);
var should = chai.should();

describe('layer groups service', function () {

  it('is registered as a service', function() {
    assert.ok(app.service('layer-groups'));
  });

  it('can create a layerGroup', function(done){
    var data = {
      name: 'Name 1',
      description: 'Description of analysis 1',
      layers: [ 'layerId1', 'layerId2' ]
    }

    chai.request(app)
      .post('/layer-groups')
      .set('Authorization', global.token)
      .send(data)
      .end(function (err, res) {
        if (err) console.log(err);

        should.not.exist(err);

        res.body.should.have.property('id');
        res.body.should.have.property('name', data.name);
        res.body.should.have.property('description', data.description);
        res.body.should.have.property('layers').which.has.length(2);

        done();
    });
  });

});
