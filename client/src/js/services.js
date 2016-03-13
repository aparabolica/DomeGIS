(function(angular, undefined) {

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
          getContentTypes: function() {
            return [
              'Web Map',
              'CityEngine Web Scene',
              'Web Scene',
              'Pro Map',
              'Feature Service',
              'Map Service',
              'Image Service',
              'KML',
              'WMS',
              'Feature Collection',
              'Feature Collection Template',
              'Geodata Service',
              'Globe Service',
              'Geometry Service',
              'Geocoding Service',
              'Network Analysis Service',
              'Geoprocessing Service',
              'Workflow Manager Service',
              'Web Mapping Application',
              'Mobile Application',
              'Code Attachment',
              'Operations Dashboard Add In',
              'Operation View',
              'Operations Dashboard Extension',
              'Native Application',
              'Native Application Template',
              'Native Application Installer',
              'Workforce Project',
              'Form',
              'Symbol Set',
              'Color Set',
              'Shapefile',
              'File geodatabase',
              'CSV',
              'CAD Drawing',
              'Service Definition',
              'Document Link',
              'Microsoft Word',
              'Microsoft Powerpoint',
              'Microsoft Excel',
              'PDF',
              'Image',
              'Visio Document',
              'iWork Keynote',
              'iWork Pages',
              'iWork Numbers',
              'Report Template'
            ];
          },
          getContent: function(search, params) {
            var deferred = $q.defer();
            search = search || '';
            params = params || {};
            getOrganization.then(function(data) {
              var q = angular.extend({
                orgid: data.data.id
              }, params);
              var qString = '"' + search + '"';
              for(var key in q) {
                if(q[key])
                  qString += ' (' + key + ':"' + q[key] + '")';
              }
              return $http.get(apiRoot + '/search', {
                params: {
                  f: 'json',
                  num: 20,
                  q: qString
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

})(window.angular);
