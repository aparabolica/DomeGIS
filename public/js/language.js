var langConfig = {
  'pt': '',
  'en': '',
  'es': ''
};

String.prototype.langsplit = function(_regEx){
	// Most browsers can do this properly, so let them work, they'll do it faster
	if ('a~b'.split(/(~)/).length === 3){ return this.split(_regEx); }

	if (!_regEx.global)
	{ _regEx = new RegExp(_regEx.source, 'g' + (_regEx.ignoreCase ? 'i' : '')); }

	// IE (and any other browser that can't capture the delimiter)
	// will, unfortunately, have to be slowed down
	var start = 0, arr=[];
	var result;
	while((result = _regEx.exec(this)) != null){
		arr.push(this.slice(start, result.index));
		if(result.length > 1) arr.push(result[1]);
		start = _regEx.lastIndex;
	}
	if(start < this.length) arr.push(this.slice(start));
	if(start == this.length) arr.push(''); //delim at the end
	return arr;
};

langGetSplitBlocks = function(text) {
	var split_regex = /(<!--:[a-z]{2}-->|<!--:-->|\[:[a-z]{2}\]|\[:\]|\{:[a-z]{2}\}|\{:\})/gi; // @since 3.3.6 swirly brackets
	return text.langsplit(split_regex);
};

langSplit = function(text) {
	var blocks = langGetSplitBlocks(text);
	return langSplitBlocks(blocks);
}

langSplitBlocks = function(blocks) {
	var result = new Object;
	for(var lang in langConfig) {
		result[lang] = '';
	}
	if(!blocks || !blocks.length)
		return result;
	if(blocks.length==1) {
		var b=blocks[0];
		for(var lang in langConfig){
			result[lang] += b;
		}
		return result;
	}
	var clang_regex=/<!--:([a-z]{2})-->/gi;
	var blang_regex=/\[:([a-z]{2})\]/gi;
	var slang_regex=/\{:([a-z]{2})\}/gi;
	var lang = false;
	var matches;
	for(var i = 0;i<blocks.length;++i){
		var b=blocks[i];
		if(!b.length) continue;
		matches = clang_regex.exec(b); clang_regex.lastIndex=0;
		if(matches!=null){
			lang = matches[1];
			continue;
		}
		matches = blang_regex.exec(b); blang_regex.lastIndex=0;
		if(matches!=null){
			lang = matches[1];
			continue;
		}
		matches = slang_regex.exec(b); slang_regex.lastIndex=0;
		if(matches!=null){
			lang = matches[1];
			continue;
		}
		if( b == '<!--:-->' || b == '[:]' || b == '{:}' ){
			lang = false;
			continue;
		}
		if(lang){
			if(!result[lang]) result[lang] = b;
			else result[lang] += b;
			lang = false;
		}else{ //keep neutral text
			for(var key in result){
				result[key] += b;
			}
		}
	}
	return result;
}

function langJoin(obj) {
  var str = '';
  for(var key in obj) {
    str += '[:' + key + ']' + obj[key];
  }
  return str;
}

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
])
.filter('translate', [
  'Lang',
  function(Lang) {
    return function(input) {
      if(typeof input == 'object')
        return input[Lang.get()];
      else
        return langSplit(input)[Lang.get()];
    }
  }
])
.filter('langJoin', [
  function() {
    return function(input) {
      return langJoin(input);
    }
  }
])
.filter('langSplit', [
  function() {
    return function(input) {
      return langSplit(input);
    }
  }
]);
