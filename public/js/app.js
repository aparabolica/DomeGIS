angular.module('domegis', [
  'angular-loading-bar',
  'ngCookies',
  'ui.router',
  'ngFileUpload',
  'ui.sortable',
  'ui.ace',
  'timer',
  'colorpicker.module',
  'infinite-scroll'
]);

angular.element(document).ready(function() {
  if(self != top) {
    angular.element('body').addClass('iframe');
  }
  angular.bootstrap(document, ['domegis']);
  angular.element('body').css({display:'block'});
});
