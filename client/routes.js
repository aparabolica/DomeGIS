angular.module('domegis').config(function ($urlRouterProvider, $stateProvider, $locationProvider) {
  $locationProvider.html5Mode({
    enabled: false,
    requireBase: false
  });
  $locationProvider.hashPrefix('!');


  $stateProvider
    .state('home', {
      url: '/',
      template: '<content-query></content-query>',
      resolve: {
        Content: [
          'esriService',
          function(Esri) {
            return Esri.getContent();
          }
        ]
      }
    })
    .state('contents', {
      url: '/contents',
      template: '<contents-list></contents-list>'
    })
    .state('contentDetails', {
      url: '/contents/:contentId',
      template: '<content-details></content-details>'
    });

  $urlRouterProvider.otherwise("/contents");
});
