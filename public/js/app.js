angular.module('domegis', [
  'ui.router',
  'ui.sortable',
  'ui.ace',
  'colorpicker.module'
]);

angular.element(document).ready(function() {
  angular.bootstrap(document, ['domegis']);
});
