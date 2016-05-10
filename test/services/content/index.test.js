'use strict';

var async = require('async');
var request = require('request');
var should = require('should');
var app = require('../../../src/app');
var replay = require('replay');
var Contents;
var Layers;
var Search;

describe('content service', function()  {
  this.timeout(600000)

  var payloadContent1 = {
    "id": "4831c454070f4571a14230d3c3b1253f",
    "owner": "bernardo@wwf.org.br_panda",
    "created": 1452008850000,
    "modified": 1452008865000,
    "guid": null,
    "name": "BASE_DE_DADOS",
    "title": "BASE_DE_DADOS",
    "type": "Feature Service",
    "typeKeywords": ["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Metadata", "Multilayer", "Service", "Hosted Service"],
    "description": null,
    "tags": ["xxx"],
    "snippet": "xxx",
    "thumbnail": "thumbnail/thumbnail.png",
    "documentation": null,
    "extent": [
        [-47.6417808970707, -20.93332468845277],
        [-36.30010159391338, -7.266646618809102]
    ],
    "spatialReference": "GCS_SIRGAS_2000",
    "accessInformation": null,
    "licenseInfo": null,
    "culture": "pt-br",
    "properties": null,
    "url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/BASE_DE_DADOS/FeatureServer",
    "access": "public",
    "size": -1,
    "appCategories": [],
    "industries": [],
    "languages": [],
    "largeThumbnail": null,
    "banner": null,
    "screenshots": [],
    "listed": false,
    "numComments": 0,
    "numRatings": 0,
    "avgRating": 0,
    "numViews": 31
  }

  var payloadContent2 = {
    "id": "ef1b62313b1a4f598c5a36eab36cd81c",
    "owner": "birgit.zander",
    "created": 1401795468000,
    "modified": 1439209758000,
    "guid": null,
    "name": "WM_spielorte",
    "title": "WM_spielorte",
    "type": "Feature Service",
    "typeKeywords": ["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"],
    "description": "This service shows the places of the football world cup 2014 in Brazil",
    "tags": ["WM; WWF", "WWF", "GLOBIL", "South America", "Brazil", "Amazon", "Atlantic Forest", "Cerrado Pantanal", "Caatinga", "Paraguay river", "Paraguay basin", "Pampa", "brazilian amazon", "biodiversity", "biome", "ecosystem", "species", "interactive map", "web map", "webmap", "WM"],
    "snippet": "shows the places of the Football world cup 2014 in Brazil",
    "thumbnail": "thumbnail/thumbnail.png",
    "documentation": null,
    "extent": [
        [-79.43629454451586, -30.040001932867266],
        [-34.9149954693725, 8.603646492564732]
    ],
    "spatialReference": "WGS_1984_Web_Mercator_Auxiliary_Sphere",
    "accessInformation": "WWF Germany",
    "licenseInfo": null,
    "culture": "de-de",
    "properties": null,
    "url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/WM_spielorte/FeatureServer",
    "access": "public",
    "size": -1,
    "appCategories": [],
    "industries": [],
    "languages": [],
    "largeThumbnail": null,
    "banner": null,
    "screenshots": [],
    "listed": false,
    "numComments": 0,
    "numRatings": 0,
    "avgRating": 0,
    "numViews": 3721
  }

  before(function(doneBefore) {
    this.server = app.listen(3030);
    this.server.once('listening', function(){

      Contents = app.service('contents');
      Layers = app.service('layers');
      Search = app.service('search');


      // wait for server to sync db
      setTimeout(function(){
        var sequelize = app.get('sequelize');
        sequelize.query('DELETE FROM contents; DELETE FROM layers; DELETE FROM views;')
          .then(function(results){
            doneBefore();
          }).catch(doneBefore);
      }, 1000);
    });
  });

  it('registered the contents service', function() {
    should.exist(Contents);
  });


  it('allow content creation', function (doneIt) {
    Contents
      .create(payloadContent1)
      .then(function(content) {
        content.should.have.property('id', payloadContent1.id);
        return content.getLayers().then(function(result){
          result.should.be.an.Array().and.have.length(3);
          doneIt();
        });
      })
      .catch(doneIt);
  });

  it('content is inserted properly', function(doneIt){
    Contents
      .get(payloadContent1.id)
      .then(function(result){
        var content = result.dataValues;
        should.exist(content);
        content.should.have.property('createdAt', new Date(payloadContent1.created));
        content.should.have.property('modifiedAt', new Date(payloadContent1.modified));
        content.should.have.property('name', payloadContent1.name);
        content.should.have.property('title', payloadContent1.title);
        content.should.have.property('description', payloadContent1.description);
        content.should.have.property('url', payloadContent1.url);
        content.should.have.property('tags');
        content.tags.should.be.an.Array();
        doneIt();
      })
      .catch(doneIt);
  });

  it('layers are created with content', function(doneIt){
    Layers
      .find({
        contentId: payloadContent1.id
      })
      .then(function(result){
        result.should.have.property('total', 3);

        doneIt();
      })
      .catch(doneIt);
  });

  it('create another content', function (doneIt) {
    Contents
      .create(payloadContent2)
      .then(function(content) {
        content.should.have.property('id', payloadContent2.id);
        return content.getLayers().then(function(result){
          result.should.be.an.Array().and.have.length(2);
          async.eachSeries(result, function(layer, doneEach){
            layer.fields.should.be.an.Array().and.not.have.length(0);
            doneEach();
          }, doneIt);
        });
      })
      .catch(doneIt);
  });


  it('layers are removed with content', function(doneIt){
    // create a layer not related to content
    Contents
      .remove(payloadContent1.id)
      .then(function(result){
        Layers
          .find({ contentId: payloadContent1.id })
          .then(function(result){
            result.should.have.property('total', 2);
            doneIt();
          })
          .catch(doneIt);
      })
      .catch(doneIt);
  });

  it('search term that appears on content', function (doneIt) {
    Search
      .find({
        query: {
          term: 'world cup'
        }
      })
      .then(function(response) {
        response.should.have.property('contents');
        response.contents.should.have.length(1);
        doneIt();
      })
      .catch(doneIt);
  });

  it('search term that appears on layer', function (doneIt) {
    Search
      .find({
        query: {
          term: 'ecore'
        }
      })
      .then(function(response) {
        response.should.have.property('layers');
        response.layers.should.have.length(1);

        var layer = response.layers[0];
        layer.should.have.property('id', 'ef1b62313b1a4f598c5a36eab36cd81c_1');

        doneIt();
      })
      .catch(doneIt);
  });

  it('search term that appears on features', function (doneIt) {
    Search
      .find({
        query: {
          term: 'bras'
        }
      })
      .then(function(response) {
        response.should.have.property('features');
        response.features.should.have.length(1);
        doneIt();
      })
      .catch(doneIt);
  });

});
