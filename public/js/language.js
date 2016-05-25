angular.module('domegis')

.factory('Lang', [
  '$cookies',
  function($cookies) {

    if(!$cookies.get('lang')) {
      $cookies.put('lang', 'en');
    }

    return {
      get: function() {
        return $cookies.get('lang');
      },
      set: function(lang) {
        $cookies.put('lang', lang);
      }
    }
  }
]);
