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
        return field.name.trim().toLowerCase() !== 'fid' &&
          field.name !== 'OBJECTID' &&
          field.name.trim().toLowerCase() !== 'id' &&
          field.name !== 'OBJECTID_1';
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
