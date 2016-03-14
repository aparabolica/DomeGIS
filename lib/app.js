'use strict';

angular.module('domegis', [
  'ui.router'
]);

if(Meteor.isClient) {
  angular.element(document).ready(function() {
    angular.bootstrap(document, ['domegis']);
  });
}
