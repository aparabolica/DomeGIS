angular.module('domegis')

.controller('SiteCtrl', [
  '$state',
  'Server',
  '$scope',
  'MessageService',
  function($state, Server, $scope, Message) {

    Server.auth().then(function() {
      $scope.token = Server.app.get('token');
      $scope.user = Server.app.get('user');
      $scope.currentUser = $scope.user;
    });

    $scope.auth = function(credentials) {
      Server.auth(_.extend({
        type: 'local'
      }, credentials)).then(function() {
        $scope.token = Server.app.get('token');
        $scope.user = Server.app.get('user');
        $scope.currentUser = $scope.user;
        if($state.current.name == 'login')
          $state.go('home');
      }, function(err) {
        Message.add(err.message);
      });
    };

    $scope.resetPwd = function(credentials) {
      Server.resetPwd(credentials).then(function(res) {
        Message.add(res.data.message);
        $state.go('login');
      }, function(err) {
      });
    };

    $scope.logout = function() {
      $scope.token = undefined;
      $scope.user = undefined;
      $scope.currentUser = undefined;
      Server.app.logout();
      $state.go('home');
    };

    $scope.hasRole = function(role) {
      if($scope.user)
        return _.find($scope.user.roles, function(r) { return r == role; });
      else
        return false;
    }

    $scope.getLogs = function() {
      Server.find(Server.service('/admin/logs.csv')).then(function(data) {
        var uri = 'data:text/csv;charset=utf-8,' + escape(data);
        var link = document.createElement('a');
        link.href = uri;
        link.style = 'visibility:hidden';
        link.download = 'domegis-logs.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    };

    $scope.bodyClass = [];

    $scope.$on('$stateChangeStart', function(ev, toState, toParams) {
      $scope.bodyClass = [];
      if(toState.name == 'generateMap' || toState.name == 'singleMap') {
        $scope.bodyClass.push('map');
      }
      $scope.bodyClass.push('loading');
    });

    $scope.$on('$stateChangeSuccess', function(ev, toState, toParams) {
      if(toState.name == 'login' && $scope.token)
        $state.go('home');
      $scope.bodyClass = _.filter($scope.bodyClass, function(c) {
        return c != 'loading';
      });
      if($scope.user && $scope.user.roles) {
        $scope.user.roles.forEach(function(role) {
          $scope.bodyClass.push('user-' + role);
        });
      }
      $scope.bodyClass.push('loaded');
    });

  }
])

.controller('MapEditCtrl', [
  '$scope',
  '$state',
  'Lang',
  'Server',
  'Analyses',
  'Edit',
  'MessageService',
  function($scope, $state, Lang, Server, Analyses, Edit, Message) {

    $scope.map = _.defaults(Edit, {
      layers: [],
      widgets: [],
      baseLayer: '',
      scrollWheelZoom: false,
      language: ''
    });

    $scope.setting = 'layer';
    $scope.setSetting = function(setting) {
      $scope.setting = setting;
    };

    var mapService = Server.service('maps');
    var searchService = Server.service('search');
    var layerService = Server.service('layers');
    var viewService = Server.service('views');

    $scope.analyses = Analyses.data;
    $scope.langs = Lang.getLanguages();

    $scope.showNewLayerBox = false;

    $scope.toggleNewLayer = function() {
      $scope.showNewLayerBox = $scope.showNewLayerBox ? false : true;
    };

    $scope.search = '';
    $scope.results = [];
    $scope.$watch('search', function(search) {
      if(search) {
        searchService.find({
          query: {
            'term': search
          }
        }).then(function(res) {
          $scope.$apply(function() {
            if(res.layers && res.layers.length) {
              $scope.results = res.layers;
            } else {
              $scope.results = [];
            }
          });
        });
      } else {
        $scope.results = [];
      }
    });

    $scope.layers = {};

    $scope.hasLayer = function(layer) {
      return _.find($scope.map.layers, function(l) { return l.layerId == layer.id; });
    };

    $scope.addLayer = function(layer) {
      if($scope.hasLayer(layer))
        return false;
      $scope.layers[layer.id] = layer;
      $scope.search = '';
      var mapLayer = {
        layerId: layer.id
      };
      $scope.map.layers.unshift(mapLayer);
    };

    var populateViews = function(mapLayer, layer) {
      viewService.find({
        query: {
          layerId: layer.id,
          $limit: 100
        }
      }).then(function(res) {
        $scope.$apply(function() {
          if(!res.data.length) {
            Message.add('This layer has no views.');
            $scope.removeLayer(mapLayer.layerId);
          } else {
            layer.views = res.data;
            if(!mapLayer.hidden)
              mapLayer.hidden = false;
            if(!mapLayer.id)
              mapLayer.id = res.data[0].id;
          }
        });
      });
    };

    $scope.$watch('map.layers', function(layers, prevLayers) {
      if(layers !== prevLayers || _.isEmpty($scope.layers)) {
        $scope.map.layers.forEach(function(mapLayer) {
          if($scope.layers[mapLayer.layerId]) {
            populateViews(mapLayer, $scope.layers[mapLayer.layerId]);
          } else {
            Server.get(layerService, mapLayer.layerId).then(function(layer) {
              $scope.layers[layer.id] = layer;
              populateViews(mapLayer, $scope.layers[mapLayer.layerId]);
            });
          }
        });
      }
    }, true);

    $scope.removeLayer = function(layerId) {
      delete $scope.layers[layerId];
      $scope.map.layers = _.filter($scope.map.layers, function(l) {
        return l.id !== layerId && l.layerId !== layerId;
      });
    };

    $scope.save = function(map) {
      if(Edit.id) {
        Server.patch(mapService, Edit.id, map).then(function(map) {
          $scope.map = map;
          Message.add('Map saved');
          // $state.go('editMap', {id: map.id}, {reload: true});
        }, function(err) {
          Message.add(err.message);
        });
      } else {
        Server.create(mapService, map).then(function(map) {
          $scope.map = map;
          $state.go('editMap', {id: map.id}, {reload: true});
          Message.add('Map created');
        }, function(err) {
          Message.add(err.message);
        });
      }
    };

    $scope.getMapURL = function() {
      return $state.href('singleMap', { id: $scope.map.id }, { absolute: true });
    };

    $scope.getHTMLEmbed = function() {
      return '<iframe src="' + $scope.getMapURL() + '" width="100%" height="400" frameborder="0" allowfullscreen></iframe>';
    };

    $scope.getWPShortcode = function() {
      var config = {
        id: $scope.map.id
      };
      var shortcode = '[domegis_map';
      for(var key in config) {
        if(config[key])
          shortcode += ' ' + key + '="' + config[key] + '"';
      }
      shortcode += ']';
      return shortcode;
    };
  }
])

.controller('QueryCtrl', [
  '$scope',
  'Content',
  'Synced',
  'Derived',
  'Uploaded',
  'Server',
  'esriService',
  'MessageService',
  function($scope, Content, Synced, Derived, Uploaded, Server, Esri, Message) {

    var contentService = Server.service('contents');

    $scope.content = Content;

    $scope.search = '';
    $scope.query = {
      type: 'Feature Service'
    };
    $scope.params = {
      num: 20,
      start: 1
    };

    $scope.sort = 'modified';

    $scope.doQuery = function() {
      $scope.params.start = 1;
      $scope.doSort();
      Esri.getContent(
        $scope.search,
        $scope.query,
        $scope.params
      ).then(function(data) {
        $scope.content = data;
        $scope.params.start = data.nextStart;
        $scope.params.total = data.total;
      });
    };

    $scope.esriPaging = true;
    $scope.pageEsri = _.debounce(function() {
      if($scope.params.total - $scope.params.num > 0 && $scope.esriPaging) {
        Esri.getContent(
          $scope.search,
          $scope.query,
          $scope.params
        ).then(function(data) {
          $scope.content.results = $scope.content.results.concat(data.results);
          if(data.nextStart < 0) {
            $scope.esriPaging = false;
          } else {
            $scope.params.start = data.nextStart;
          }
          $scope.params.total = data.total;
        });
      }
    }, 200);

    $scope.$watchGroup(['search', 'query'], _.debounce(function() {
      $scope.doQuery();
    }, 500), true);

    $scope.doSort = function() {
      $scope.params = _.extend($scope.params, {
        sortField: $scope.sort,
        sortOrder: getSortOrder($scope.sort)
      });
    };

    function getSortOrder(sort) {
      if(sort == 'title' || sort == 'owner') {
        return 'asc';
      } else {
        return 'desc';
      }
    }

    $scope.syncItem = function(item) {
      return Server.create(contentService, item).then(function() {
      }, function(err) {
        Message.add(err.message);
      });
    };

    $scope.unsyncItem = function(item) {
      Server.remove(contentService, item.id);
    };


    $scope.toggleSync = function(item) {
      if(!$scope.isSynced(item)) {
        $scope.syncItem(item).then(function() {
          item.$viewLayers = true;
        });
      } else {
        if(confirm('Are you sure you\'d like to remove this content from collection?'))
          $scope.unsyncItem(item);
      }
    };

    $scope.toggleLayers = function(item, isEditor) {
      if(item.$viewLayers) {
        item.$viewLayers = false;
      } else {
        if(item.source && item.source == 'derived') {
          item.$viewLayers = true;
        } else if(!$scope.isSynced(item) && isEditor) {
          if(confirm('Would you like to add this content to collection?')) {
            $scope.toggleSync(item);
          }
        } else {
          item.$viewLayers = true;
        }
      }
    }

    $scope.synced = Synced.data;

    $scope.$on('server.contents.created', function(ev, data) {
      if(!$scope.isSynced(data))
        $scope.synced.push(data);
    });

    $scope.$on('server.contents.removed', function(ev, data) {
      $scope.synced = _.filter($scope.synced, function(item) {
        return item.id !== data.id;
      });
    });

    $scope.isSynced = function(item) {
      if(item.source && (item.source == 'derived' || item.source == 'uploaded')) {
        return item;
      } else {
        return _.find($scope.synced, function(s) {
          return item.id == s.id;
        });
      }
    };

    $scope.derived = Derived.data;

    $scope.removeLayer = function(layer) {
      if(confirm('Are you sure?')) {
        Server.remove(Server.service('layers'), layer.id).then(function() {
          $scope.derived = _.filter($scope.derived, function(item) {
            return item.id !== layer.id;
          });
        });
      }
    };

    $scope.uploaded = Uploaded.data;

    $scope.$on('server.layers.removed', function(ev, data) {
      $scope.uploaded = _.filter($scope.uploaded, function(item) {
        return item.id !== data.id;
      });
    });

    $scope.collectionSource = 'arcgis';

    $scope.setCollection = function(source) {
      $scope.collectionSource = source;
    };

  }
])

.controller('UploadCtrl', [
  '$scope',
  '$state',
  'Upload',
  '$q',
  'MessageService',
  function($scope, $state, Upload, $q, Message) {

    var uploadUrl = '/uploads';

    $scope.progress = {};

    $scope.uploaded = [];

    var upload = function(file) {
      return Upload.upload({
        url: uploadUrl,
        data: {
          file: file,
          name: file.name
        }
      }).then(function(res) {
        $scope.uploaded.push(res.data);
      }, function(err) {
        // console.log(err);
      }, function(evt) {
        $scope.progress[file.name] = [evt.loaded, evt.total];
      });
    };

    $scope.$on('server.layers.patched', function(ev, layer) {
      $scope.uploaded.forEach(function(u, i) {
        if(u.layer.id == layer.id) {
          $scope.uploaded[i].layer = layer;
        }
      });
    });

    $scope.uploadFiles = function(files) {
      if(files && files.length) {
        var promises = [];
        for(var i = 0; i < files.length; i++) {
          promises.push(upload(files[i]));
        }
        $q.all(promises).then(function(files) {
          $scope.progress = {};
        });
      }
    };

    $scope.getProgress = function() {
      var prog = [0,0];
      if(!_.isEmpty($scope.progress)) {
        for(var key in $scope.progress) {
          if($scope.progress[key][1]) {
            prog[0] += $scope.progress[key][0];
            prog[1] += $scope.progress[key][1];
          }
        }
      }
      if(prog[0])
        return (100.0 * prog[0] / prog[1]).toFixed(2);
      else
        return 0;
    }
  }
])

.controller('LayerEditCtrl', [
  '$scope',
  'Server',
  'Edit',
  'Lang',
  'MessageService',
  function($scope, Server, Edit, Lang, Message) {

    var layerService = Server.service('layers');

    $scope.layer = angular.copy(Edit);

    $scope.layer.name = langSplit($scope.layer.name);

    $scope.langs = Lang.getLanguages();

    $scope.lang = Lang.get();

    $scope.formLang = function(lang) {
      $scope.lang = lang;
    };

    $scope.save = function(layer) {
      layer.name = langJoin(layer.name);
      if(Edit.id) {
        Server.update(layerService, Edit.id, layer).then(function(layer) {
          $scope.layer = layer;
          $scope.layer.name = langSplit($scope.layer.name);
        }, function(err) {
          Message.add(err.message);
        });
      } else {
        Server.create(layerService, layer).then(function(layer) {
          $scope.layer = layer;
          $scope.layer.name = langSplit($scope.layer.name);
        }, function(err) {
          Message.add(err.message);
        });
      }
    };

  }
])

.controller('ArcGisCtrl', [
  '$scope',
  function($scope) {
    $scope.getArcGisUrl = function(content) {
      return 'http://' + arcgis.organization + '.maps.arcgis.com/home/item.html?id=' + content.id;
    }
  }
])

.controller('ContentEditCtrl', [
  '$scope',
  'Server',
  'Edit',
  function($scope, Server, Edit) {

    var contentService = Server.service('contents');

    $scope.content = angular.copy(Edit);

    $scope.save = function(content) {
      if(Edit.id) {
        Server.update(contentService, Edit.id, content);
      } else {
        Server.create(contentService, content);
      }
    };

  }
])

.controller('ViewEditCtrl', [
  '$scope',
  '$state',
  'Server',
  'Edit',
  'Layer',
  'Distinct',
  'MessageService',
  function($scope, $state, Server, Edit, Layer, Distinct, Message) {

    $scope.distinct = Distinct.data;

    var viewService = Server.service('views');
    var previewService = Server.service('previews');

    $scope.layer = Layer;

    $scope.view = angular.copy(Edit);

    if(!$scope.view.fields)
      $scope.view.fields = [];

    $scope.toggleField = function(field) {
      var idx = $scope.view.fields.indexOf(field.name);
      // is currently selected
      if (idx > -1) {
        $scope.view.fields.splice(idx, 1);
      }
      // is newly selected
      else {
        $scope.view.fields.push(field.name);
      }
    };

    $scope.viewSort = function(field) {
      return $scope.view.fields.indexOf(field.name);
    };

    $scope.$watch('view.style', _.debounce(function() {
      if($scope.view.id) {
        Server.update(previewService, $scope.view.id, $scope.view).then(function(preview) {
          $scope.$broadcast('updateLayers');
        });
      } else {
        Server.create(previewService, $scope.view).then(function(preview) {
          $scope.view.id = preview.id;
          $scope.$broadcast('updateLayers');
        });
      }
    }, 400), true);

    $scope.save = function(view) {
      view.fields = _.compact(view.fields);
      if(Edit.id) {
        Server.patch(viewService, Edit.id, view).then(function(view) {
          $scope.view = view;
          $state.go('editView', {id: view.id}, {reload: true});
        }, function(err) {
          Message.add(err.message);
        });
      } else {
        Server.create(viewService, view).then(function(view) {
          $scope.view = view;
          $state.go('editView', {id: view.id}, {reload: true});
        }, function(err) {
          Message.add(err.message);
        });
      }
    };

  }
])

.controller('UserCtrl', [
  '$scope',
  'Server',
  'Users',
  function($scope, Server, Users) {

    var userService = Server.service('users');

    $scope.users = Users.data;

    $scope.remove = function(user) {
      if(confirm('Are you sure?')) {
        Server.remove(userService, user.id);
      }
    };

    $scope.$on('server.users.created', function(ev, data) {
      $scope.users.push(data);
    });
    $scope.$on('server.users.removed', function(ev, data) {
      $scope.users = _.filter($scope.users, function(user) {
        return user.id !== data.id;
      });
    });

  }
])

.controller('UserEditCtrl', [
  '$scope',
  '$state',
  'Server',
  'Edit',
  'MessageService',
  function($scope, $state, Server, Edit, Message) {

    var userService = Server.service('users');

    $scope.user = angular.copy(Edit);

    $scope.toggleRole = function(role) {

      if(!$scope.user.roles)
        $scope.user.roles = [];

      var idx = $scope.user.roles.indexOf(role);
      // is currently selected
      if (idx > -1) {
        $scope.user.roles.splice(idx, 1);
      }
      // is newly selected
      else {
        $scope.user.roles.push(role);
      }
    };

    $scope.save = function(user) {
      if(Edit.id) {
        delete user.password;
        Server.patch(userService, Edit.id, user).then(function(user) {
          $scope.user = user;
          Message.add('User updated');
          $state.go('usersEdit', {id: user.id}, {reload: true});
        }, function(err) {
          Message.add(err.message);
        });
      } else {
        Server.create(userService, user).then(function(user) {
          $scope.user = user;
          Message.add('User created');
          $state.go('usersEdit', {id: user.id}, {reload: true});
        }, function(err) {
          Message.add(err.message);
        });
      }
    };

    $scope.pwd = {};

    $scope.updatePwd = function(pwd) {
      if(!pwd.password) {
        alert('You have to type in a new password');
      } else if(pwd.password !== pwd.passwordRepeat) {
        alert('Passwords don\'t match');
      } else {
        Server.patch(userService, Edit.id, {
          userPassword: pwd.userPassword,
          password: pwd.password
        }).then(function(data) {
          Message.add('Password changed');
        }, function(err) {
          Message.add(err.message);
        });
      }
    }
  }
])

.controller('DerivedCtrl', [
  '$http',
  '$scope',
  '$state',
  '$stateParams',
  '$filter',
  'Data',
  'Layers',
  'Server',
  'MessageService',
  function($http, $scope, $state, $stateParams, $filter, Data, Layers, Server, Message) {

    var aceLoaded = function(editor) {
      var staticWordCompleter = {
        getCompletions: function(editor, session, pos, prefix, callback) {
          callback(null, Layers.data.map(function(layer) {
            return {
              caption: $filter('translate')(layer.name),
              value: layer.name,
              meta: "layer",
              _id: layer.id,
              completer: {
                insertMatch: function(editor, data) {
                  if (editor.completer.completions.filterText) {
                    var ranges = editor.selection.getAllRanges();
                    for (var i = 0, range; range = ranges[i]; i++) {
                      range.start.column -= editor.completer.completions.filterText.length;
                      editor.session.remove(range);
                    }
                  }
                  editor.execCommand("insertstring", '"' + data._id + '"');
                }
              }
            };
          }));
        }
      };
      editor.completers.push(staticWordCompleter);
    };

    $scope.aceOptions = {
      mode: 'pgsql',
      useWrapMode: false,
      showGutter: false,
      theme: 'github',
      maxLines: Infinity,
      onLoad: aceLoaded,
      advanced: {
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true
      }
    };
    if(_.isArray(Data)) {
      $scope.data = Data;
      if($scope.data.length) {
        $scope.keys = Object.keys($scope.data[0]);
      }
      $scope.err = '';
    } else if(Data.message) {
      $scope.err = Data.message;
    }
    $scope.sql = $stateParams.sql;
    $scope.name = '';
    $scope.submit = function() {
      $scope.loading = true;
      $state.go($state.current.name, {sql: $scope.sql}, {reload: true});
    };
    $scope.$on('$stateChangeSuccess', function(ev, toState, toParams) {
      if(toState == $state.current.name && toParams.sql) {
        $scope.loading = false;
      }
    });
    $scope.create = function() {
      Server.create(Server.service('layers'), {
        source: 'derived',
        name: $scope.name,
        query: $stateParams.sql
      }).then(function(data) {
        $state.go('editView', {layerId: data.id});
      }, function(err) {
        Message.add(err.message);
      });
    }
  }
])

.controller('AnalysisCtrl', [
  '$scope',
  '$interval',
  'Server',
  'Analyses',
  function($scope, $interval, Server, Analyses) {

    var analysisService = Server.service('analyses');

    $scope.analyses = Analyses.data;

    $scope.getElapsedTime = function(analysis) {
      var start = analysis.task.startedAt;
      var finish = analysis.task.finishedAt || false;

      if(start && finish) {
        var elapsed = finish - start;
        return moment.duration(elapsed).humanize();
      } else {
        return '';
      }
    };

    $scope.remove = function(analysis) {
      if(confirm('Are you sure?')) {
        Server.remove(analysisService, analysis.id);
      }
    };

    $scope.$on('server.analyses.created', function(ev, data) {
      $scope.analyses.unshift(data);
    });
    $scope.$on('server.analyses.removed', function(ev, data) {
      $scope.analyses = _.filter($scope.analyses, function(item) {
        return item.id !== data.id;
      });
    });
    $scope.$on('server.analyses.updated', function(ev, data) {
      $scope.analyses.forEach(function(analysis, i) {
        if(analysis.id == data.id) {
          $scope.analyses[i] = data;
        }
      });
    });
    $scope.$on('server.analyses.patched', function(ev, data) {
      $scope.analyses.forEach(function(analysis, i) {
        if(analysis.id == data.id) {
          $scope.analyses[i] = data;
        }
      });
    });

  }
])

.controller('AnalysisSingleCtrl', [
  '$scope',
  'Analysis',
  function($scope, Analysis) {
    $scope.analysis = Analysis;
  }
])

.controller('AnalysisEditCtrl', [
  '$scope',
  '$state',
  '$filter',
  'Layers',
  'Server',
  'Edit',
  'MessageService',
  function($scope, $state, $filter, Layers, Server, Edit, Message) {

    var aceLoaded = function(editor) {
      var staticWordCompleter = {
        getCompletions: function(editor, session, pos, prefix, callback) {
          callback(null, Layers.data.map(function(layer) {
            return {
              caption: $filter('translate')(layer.name),
              value: layer.name,
              meta: "layer",
              _id: layer.id,
              completer: {
                insertMatch: function(editor, data) {
                  if (editor.completer.completions.filterText) {
                    var ranges = editor.selection.getAllRanges();
                    for (var i = 0, range; range = ranges[i]; i++) {
                      range.start.column -= editor.completer.completions.filterText.length;
                      editor.session.remove(range);
                    }
                  }
                  editor.execCommand("insertstring", '"' + data._id + '"');
                }
              }
            };
          }));
        }
      };
      editor.completers.push(staticWordCompleter);
    };

    $scope.aceOptions = {
      mode: 'pgsql',
      useWrapMode: false,
      showGutter: false,
      theme: 'github',
      maxLines: Infinity,
      onLoad: aceLoaded,
      advanced: {
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true
      }
    };

    var analysisService = Server.service('analyses');

    $scope.analysis = angular.copy(Edit);

    if(!$scope.analysis.dataTemplate)
      $scope.analysis.dataTemplate = '';

    $scope.examples = [
      'Property: {{property}}',
      'List of properties:\n{{#data}}\n  Property: {{property}}\n{{/data}}',
    ];

    $scope.properties = [];
    if($scope.analysis.results) {
      $scope.properties = Object.keys($scope.analysis.results[0]);
      if(!$scope.analysis.dataTemplate) {
        if($scope.analysis.results.length > 1) {
          $scope.analysis.dataTemplate = '{{#data}}\n\n{{/data}}';
        }
      }
    }

    $scope.addProperty = function(property) {
      if(property)
        $scope.analysis.dataTemplate += '{{' + property + '}}';
    };

    $scope.save = function(analysis) {
      if(Edit.id) {
        Server.patch(analysisService, Edit.id, analysis).then(function(analysis) {
          $scope.analysis = analysis;
          Message.add('Analysis updated');
          $state.go('analysis', {}, {reload: true});
        }, function(err) {
          Message.add(err.message);
        });
      } else {
        Server.create(analysisService, analysis).then(function(analysis) {
          $scope.analysis = analysis;
          Message.add('Analysis created');
          $state.go('analysis', {}, {reload: true});
        }, function(err) {
          Message.add(err.message);
        });
      }
    };

  }
]);
