angular.module('domegis')

.filter('dataTemplate', function() {
  return _.memoize(function(input, template) {
    var output = '';
    if(input && input.length) {
      if(input.length == 1) {
        output = Mustache.render(template, input[0]);
      } else {
        output = Mustache.render(template, input);
      }
    }
    return output;
  }, function() {
    return JSON.stringify(arguments);
  })
})

.filter('parseWidgets', [
  '$filter',
  function($filter) {
    return function(input) {
      input.forEach(function(widget) {
        if(!widget.type) return;
        widget._text = '';
        switch (widget.type) {
          case 'text':
            widget._text = widget.content
            break;
          case 'analysis':
            if(widget.content) {
              if(widget.content.dataTemplate) {
                widget._text = $filter('dataTemplate')(widget.content.results, widget.content.dataTemplate);
              } else {
                widget._text = $filter('list')(widget.content.results);
              }
            }
            break;
        }
      });
      return input;
    }
  }
])

.filter('list', [
  '$sce',
  function($sce) {
    return _.memoize(function(input) {
      var html = '';
      if(_.isArray(input)) {
        input.forEach(function(item, i) {
          html += '<div class="item-' + i + '">';
          for(var key in item) {
            html += '<p>';
            html += '<strong>' + key + ':</strong> ';
            html += item[key];
            html += '</p>';
          }
          html += '</div>';
        })
      } else if(_.isObject(input)) {
        for(var key in input) {
          html += '<p>';
          html += '<strong>' + key + ':</strong> ';
          html += input[key];
          html += '</p>';
        }
      }
      // return $sce.trustAsHtml(html);
      return html;
    }, function() {
      return JSON.stringify(arguments);
    });
  }
])

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

.filter('reverse', function() {
  return _.memoize(function(input) {
    if(_.isArray(input))
      input = input.slice().reverse();
    return input;
  }, function() {
    return JSON.stringify(arguments);
  });
})

.filter('map', [
  function() {
    return function(input, prop) {
      return _.map(input, function(item) {
        return item[prop];
      });
    }
  }
])
