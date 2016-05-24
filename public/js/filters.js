angular.module('domegis')

.filter('join', function() {
  return function(input, splitChar) {
    return input.join(splitChar);
  }
})

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

.filter('parseLayerField', [
  function() {
    return function(input) {
      return _.filter(input, function(field) {
        return field.alias.trim().toLowerCase() !== 'fid' &&
          field.alias !== 'OBJECTID' &&
          field.alias.trim().toLowerCase() !== 'id' &&
          field.alias !== 'OBJECTID_1';
      });
    }
  }
])

.filter('map', [
  function() {
    return function(input, prop) {
      return _.map(input, function(item) {
        return item[prop];
      });
    }
  }
])
