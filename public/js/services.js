angular.module('domegis')
.factory('esriService', [
  '$http',
  '$q',
  function($http, $q) {

    return {
      getContent: function(search, query, params) {
        var deferred = $q.defer();
        arcgis.getContent(search, query, params, function(res) {
          deferred.resolve(res);
        });
        return deferred.promise;
      }
    }

  }
]);
