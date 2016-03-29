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

ArcGIS.prototype.getItemSync = function(id) {
  var res = HTTP.call('GET', this.getApiRoot() + '/content/items/' + id, {
    params: {
      f: 'json'
    }
  });

  if (res.content) {
    res.data = JSON.parse(res.content);
  }

  return res;
}

ArcGIS.prototype.getItem = function(id, cb) {
  HTTP.call('GET', this.getApiRoot() + '/content/items/' + id, {
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
}

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
