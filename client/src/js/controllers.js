(function(undefined) {

  module.exports = function(app) {

    app.controller('MainCtrl', [
      '$scope',
      function($scope) {

      }
    ]);

    app.controller('QueryCtrl', [
      '$scope',
      'Content',
      function($scope, Content) {
        $scope.content = Content.data.results;
      }
    ]);

  }

})();
