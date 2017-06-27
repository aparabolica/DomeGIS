angular.module('domegis')

.factory('Server', [
  '$rootScope',
  '$http',
  '$q',
  function($rootScope, $http, $q) {

    var socket = io();

    var app = feathers()
      .configure(feathers.hooks())
      .configure(feathers.socketio(socket))
      .configure(feathers.authentication({storage: window.localStorage}));

    var req = function(req) {
      var deferred = $q.defer();
      req.then(function(res) {
        deferred.resolve(res);
      }).catch(function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    };

    return {
      app: app,
      auth: function(credentials) {
        return req(app.authenticate(credentials));
      },
      resetPwd: function(credentials) {
        return $http.get('/reset', {
          params: credentials
        });
      },
      service: function(serviceName) {
        return app.service(serviceName);
      },
      create: function(service, data) {
        return req(service.create(data));
      },
      update: function(service, id, data) {
        return req(service.update(id, data));
      },
      patch: function(service, id, data) {
        return req(service.patch(id, data));
      },
      remove: function(service, id) {
        return req(service.remove(id));
      },
      find: function(service, params) {
        return req(service.find(params));
      },
      get: function(service, id) {
        return req(service.get(id));
      },
      on: function(service, eventName, callback) {
        service.on(eventName, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            callback.apply(service, args);
          });
        });
      }
    };
  }
])

.run([
  'Server',
  '$rootScope',
  function(Server, $rootScope) {
    var Services = {};
    var services = ['layers', 'categories', 'contents', 'users', 'views', 'previews', 'analyses', 'maps'];
    var events = ['created', 'patched', 'updated', 'removed'];
    services.forEach(function(service) {
      Services[service] = Server.service(service);
    });
    for(var service in Services) {
      (function(service) {
        events.forEach(function(ev, i) {
          Server.on(Services[service], ev, function(data) {
            $rootScope.$broadcast('server.' + service + '.' + events[i], data);
          })
        });
      })(service);
    }
  }
]);
