(function(undefined) {

  module.exports = function(app) {

    app.factory('esriService', [
      '$http',
      '$q',
      'esriOrganization',
      function($http, $q, Organization) {

        var apiRoot = 'https://' + Organization + '.maps.arcgis.com/sharing/rest';

        var getOrganization = $http.get(apiRoot + '/portals/self', {
          params: {
            f: 'json'
          }
        });

        return {
          getApiRoot: function() {
            return apiRoot;
          },
          getOrganization: function() {
            return getOrganization;
          },
          getContent: function() {
            var deferred = $q.defer();
            getOrganization.then(function(data) {
              console.log(data);
              return $http.get(apiRoot + '/search', {
                params: {
                  f: 'json',
                  num: 100,
                  q: 'orgid:' + data.data.id
                }
              }).then(function(data) {
                console.log(data);
                deferred.resolve(data);
              });
            });
            return deferred.promise;
          }
        }

      }
    ]);

  };

})();
