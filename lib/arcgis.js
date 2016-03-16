ArcGIS = function(organization) {
  this.organization = organization;
  return this;
};

ArcGIS.prototype.getApiRoot = function() {
  return 'https://' + this.organization + '.maps.arcgis.com/sharing/rest';
};

ArcGIS.prototype.getOrganization = function(cb) {
  HTTP.call('GET', this.getApiRoot() + '/portals/self', {
    params: {
      f: 'json'
    }
  }, function(err, res) {
    if(!err)
      res.data = JSON.parse(res.content);
    if(typeof cb == 'function') {
      cb(err || res);
    }
  });
};

ArcGIS.prototype.getContent = function(search, query, params, cb) {
  var self = this;
  this.getOrganization(function(res) {
    HTTP.call('GET', self.getApiRoot() + '/search', {
      params: buildSearchQuery(res.data.id, search, query, params)
    }, function(err, res) {
      if(!err)
        res.data = JSON.parse(res.content);
      if(typeof cb == 'function') {
        cb(err || res);
      }
    });
  });
};

function buildSearchQuery(orgId, search, query, params) {
  search = search || '';
  query = query || {};
  params = params || {};

  var q = angular.extend({
    orgid: orgId
  }, query);
  var qString = '"' + search + '"';
  for(var key in q) {
    if(q[key])
      qString += ' (' + key + ':"' + q[key] + '")';
  }

  return _.extend({
    f: 'json',
    num: 20,
    q: qString
  }, params);
}

arcgis = new ArcGIS('panda');
