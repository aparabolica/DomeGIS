angular.module('domegis')

.filter('formatDate', [
  function() {
    return function(input, format) {
      if(input) {
        input = moment(input).format(format || 'LLLL');
      }
      return input;
    }
  }
])

.filter('fromNow', [
  function() {
    return function(input, format) {
      if(input) {
        input = moment(input).fromNow();
      }
      return input;
    }
  }
])
