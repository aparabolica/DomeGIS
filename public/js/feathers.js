angular.module('domegis')

.factory('Server', [
  '$rootScope',
  '$q',
  function($rootScope, $q) {

    var rest = feathers.rest();

    var app = feathers()
      .configure(feathers.hooks())
      .configure(rest.jquery(window.jQuery));

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
      service: function(serviceName) {
        return app.service(serviceName);
      },
      create: function(service, data) {
        return req(service.create(data));
      },
      find: function(service, params) {
        return req(service.find(params));
      },
      get: function(service, id) {
        return req(service.get(id));
      }
    };

    // return {
    //   on: function (eventName, callback) {
    //     socket.on(eventName, function () {
    //       var args = arguments;
    //       $rootScope.$apply(function () {
    //         callback.apply(socket, args);
    //       });
    //     });
    //   },
    //   emit: function (eventName, data, callback) {
    //     socket.emit(eventName, data, function () {
    //       var args = arguments;
    //       $rootScope.$apply(function () {
    //         if (callback) {
    //           callback.apply(socket, args);
    //         }
    //       });
    //     })
    //   }
    // };
  }
]);
