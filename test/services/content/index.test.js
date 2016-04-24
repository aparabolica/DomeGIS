'use strict';

var request = require('request');
var should = require('should');
var app = require('../../../src/app');
var Contents;
var Layers;

describe('content service', function()  {
  this.timeout(10000)

  var payload = {
      "id": "cf11ef6d41044be287e31f5a017f4f96",
      "owner": "WWF_Globil",
      "created": 1416245605000,
      "modified": 1454435077000,
      "guid": null,
      "name": "Amazon_Globil",
      "title": "Amazon_Globil",
      "type": "Feature Service",
      "typeKeywords": ["ArcGIS Server", "Data", "Feature Access",
          "Feature Service", "Service", "Hosted Service"
      ],
      "description": null,
      "tags": ["WWF", "GLOBIL",
          "South America", "Brazil", "Bolivia", "Peru", "Ecuador", "Colombia", "Venezuela", "Guiana",
          "Suriname", "French Guiana", "Amazon", "Amazon and Guianas", "Panamazon", "biodiversity", "biome",
          "boundary", "ecosystem", "infrastructure", "landuse", "landcover", "natural resources", "threats",
          "terrestrial", "fire", "protected area", "overlay layers", "web map", "webmap", "interactive map"
      ],
      "snippet": "overview of the amazon ecoregion",
      "thumbnail": "thumbnail/thumbnail.png",
      "documentation": null,
      "extent": [
          [-79.9000015, -30.832888891],
          [-35.203611112, 10.5]
      ],
      "spatialReference": "WGS_1984_Web_Mercator_Auxiliary_Sphere",
      "accessInformation": null,
      "licenseInfo": null,
      "culture": "de-de",
      "properties": null,
      "url": "http://services1.arcgis.com/RTK5Unh1Z71JKIiR/arcgis/rest/services/Amazon_Globil/FeatureServer",
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
      "numViews": 19326
  }

  before(function(doneBefore) {
    this.server = app.listen(3030);
    this.server.once('listening', function(){

      Contents = app.service('contents');
      Layers = app.service('layers');


      // wait for server to sync db
      setTimeout(function(){
        doneBefore()
      }, 3000);
    });
  });

  it('registered the contents service', function() {
    should.exist(Contents);
  });


  it('allow content creation', function (doneIt) {
    Contents
      .create(payload)
      .then(function(content) {
        content.should.have.property('id', payload.id);
        return content.getLayers().then(function(result){
          result.should.be.an.Array().and.have.length(28);
          doneIt();
        });
      })
      .catch(doneIt);
  });

  it('content is inserted properly', function(doneIt){
    Contents
      .get(payload.id)
      .then(function(result){
        var content = result.dataValues;
        should.exist(content);
        content.should.have.property('createdAt', new Date(payload.created));
        content.should.have.property('modifiedAt', new Date(payload.modified));
        content.should.have.property('name', payload.name);
        content.should.have.property('title', payload.title);
        content.should.have.property('description', payload.description);
        content.should.have.property('url', payload.url);
        content.should.have.property('tags');
        content.tags.should.be.an.Array();
        doneIt();
      })
      .catch(doneIt);
  });

  it('layers are created with content', function(doneIt){
    Layers
      .find({
        contentId: payload.id
      })
      .then(function(result){
        result.should.have.property('total', 28);
        doneIt();
      })
      .catch(doneIt);
  });

  it('layers are removed with content', function(doneIt){
    // create a layer not related to content
    Layers
      .create({
        id: 'aaaaa',
        name: 'title'
      })
      .then(function(layer) {
        Contents
          .remove(payload.id)
          .then(function(result){
            Layers
              .find({ contentId: payload.id })
              .then(function(result){
                result.should.have.property('total', 1);
                doneIt();
              })
              .catch(doneIt);
          })
          .catch(doneIt);
      })
      .catch(doneIt);
  });
});
