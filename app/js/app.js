'use strict';

var sinalmetApp = angular.module('sinalmetApp', [
  'sinalmet.controllers', 'sinalmet.directives',  'sinalmet.services', 
  'sinalmet.resources', 'sinalmet.filters', 'sinalmet.models', 'ngCookies'
])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/admin/newPres', {
    templateUrl: 'partials/presentation/new.html'
    , controller: 'PresCtrl'
  })
  .when('/pres/:id', {
    templateUrl: 'partials/presentation/show.html'
    , controller: 'ShowPresCtrl'
  })
  .when('/admin/pres/:id/slides', {
    templateUrl: 'partials/slides/new.html'
    , controller: 'NewSlidesCtrl'
  })
  .when('/login', {
    templateUrl: 'partials/login.html'
    , controller: 'LoginCtrl'
  })
  .when('/logout', {
    templateUrl: 'partials/logout.html'
    , controller: 'LogoutCtrl'
  })
  .when('/main', {
    templateUrl: 'partials/main.html'
    , controller: 'MainCtrl'
  })
  .when('/logged', {
    templateUrl: 'partials/login.html'
    , controller: 'LoggedInCtrl'
  })
  .otherwise({redirectTo: '/main'});
  // ConfigCtrl -> _config.form.html
  // ConfigLayerCtrl -> config/_layer.html
}])

.factory('Auth', ['$cookieStore', function($cookieStore){
  return {
    setUser : function(aUser){
      $cookieStore.put("user", aUser);
      if (aUser) {
        this.setAdmin();
      }
    },
    getUser: function() {
      return $cookieStore.get("user");
    },
    setAdmin: function() {
      var user = $cookieStore.get("user");
      user.principal.adminPrincipal = user.principal.roles
        .some(function(role) { 
          return role === 'sinalmet_admin';
        }
      );
      $cookieStore.put("user", user);
    },
    isLoggedIn : function(){
      var user = $cookieStore.get("user");
      return (user) ? true : false;
    }
  }
}])

.run(['$rootScope', '$location', 'Auth', 
  function ($rootScope, $location, Auth) {
    $rootScope.$on('$routeChangeStart', function () {
      var allowedAll = [ // Allowed (not secure) endpoints
        '/login'
        , '/logged'
        , '/logout'
        , '/main'
      ];
      var path =  $location.path(); // Current Path
      var intercepts = allowedAll.filter(function(el) { 
        return el == path
      }).length; // > 0 if the path is allowed

      if (!intercepts) { 
        // Secure url
        if (!Auth.isLoggedIn()) {
          event.preventDefault();
          $location.path('/login');
        }
        else if (/^\/admin/.test(path) && 
          !Auth.getUser().principal.adminPrincipal) {
          event.preventDefault();
          $location.path("/main");
        }
      } 
    });
  }
])

.run(['$rootScope', function($rootScope) {
  $rootScope.maps = [];
  $rootScope.bgLayers = [];
  
  $rootScope.toggleNotification = function(status) {
    $rootScope.notification.show = true;
    $rootScope.notification.msg = status.msg;
    $rootScope.notification.success = status.success;
  };
  $rootScope.notificationDismiss = function() {
    $rootScope.notification.show = false;
  };

  $rootScope.notification = {
    show: false,
    msg: null,
    success: true
  };
}]);

