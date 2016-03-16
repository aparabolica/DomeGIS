angular.module('domegis')
.factory('esriService', [
  '$http',
  '$q',
  function($http, $q) {

    return {
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
