'use strict';

angular.module('domegis', ['ui.router', 'angular-meteor', 'ui.ace']);

angular.element(document).ready(function() {
  angular.bootstrap(document, ['domegis']);
});
