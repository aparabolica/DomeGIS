(function(angular, undefined) {

  var app = angular.module('domegis', [
    'ui.router'
  ]);

  require('./config')(app);
  require('./directives')(app);
  require('./services')(app);
  require('./controllers')(app);

  angular.element(document).ready(function() {
    angular.bootstrap(document, ['domegis']);
  });

})(window.angular);
