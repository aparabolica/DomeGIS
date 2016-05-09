ArcGIS = function(organization) {
  this.organization = organization;
  return this;
};

ArcGIS.prototype.getApiRoot = function() {
  return 'https://' + this.organization + '.maps.arcgis.com/sharing/rest';
};

ArcGIS.prototype.getOrganization = function(cb) {
  $.get(this.getApiRoot() + '/portals/self', {
    f: 'json'
  }, function(res) {
    if(typeof cb == 'function') {
      cb(res);
    }
  }, 'json');
};

ArcGIS.prototype.getContent = function(search, query, params, cb) {
  var self = this;
  this.getOrganization(function(res) {
    $.get(self.getApiRoot() + '/search', buildSearchQuery(res.id, search, query, params), function(res) {
      if(typeof cb == 'function') {
        cb(res);
      }
    }, 'json');
  });
};

ArcGIS.prototype.getItem = function(id, cb) {
  $.get(this.getApiRoot() + '/content/items/' + id, {
    f: 'json'
  }, function(res) {
    if(typeof cb == 'function') {
      cb(res);
    }
  }, 'json');
};

function buildSearchQuery(orgId, search, query, params) {
  console.log(arguments);
  search = search || '';
  query = query || {
    type: 'Feature Service'
  };
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
