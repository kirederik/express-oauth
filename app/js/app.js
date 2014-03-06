'use strict';

var inbuApp = angular.module('inbuApp', ['inbu.controllers', 'inbu.directives', 
    'inbu.services', 'inbu.resources', 'sinalmet.filters', 'inbu.models', 'ngCookies']);

inbuApp.config(['$routeProvider', function($routeProvider) {
    // $routeProvider.when('/', {templateUrl: 'partials/builder.html', controller: 'MainCtrl'});
    // $routeProvider.when('/grid', {templateUrl: 'partials/builder_grid.html', controller: 'GridCtrl'});
    // $routeProvider.when('/popup', {templateUrl: 'partials/builder_popup.html', controller: 'PopUpCtrl'});
    $routeProvider.when('/admin/newPres', {templateUrl: 'partials/presentation/new.html', controller: 'PresCtrl'});
    $routeProvider.when('/pres/:id', {templateUrl: 'partials/presentation/show.html', controller: 'ShowPresCtrl'});
    
    $routeProvider.when('/admin/pres/:id/slides', {templateUrl: 'partials/slides/new.html', controller: 'NewSlidesCtrl'});
    

    $routeProvider.when('/login', {templateUrl: 'partials/login.html', controller: 'LoginCtrl'});
    $routeProvider.when('/logout', {templateUrl: 'partials/logout.html', controller: 'LogoutCtrl'});
    $routeProvider.when('/main', {templateUrl: 'partials/main.html', controller: 'MainCtrl'});
    $routeProvider.when('/logged', {templateUrl: 'partials/login.html', controller: 'LoggedInCtrl'});
    // $routeProvider.when('/map', {templateUrl: 'partials/map.html', controller: 'MapCtrl'});
    $routeProvider.otherwise({redirectTo: '/main'});
}]);


inbuApp.factory('Auth', ['$cookieStore', function($cookieStore){
    return{
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
            return ($cookieStore.get("user")) ? $cookieStore.get("user") : false;
        }
    }
}]).run(['$rootScope', '$location', 'Auth', function ($rootScope, $location, Auth) {
    $rootScope.$on('$routeChangeStart', function () {
        
        var allowedAll = [
            '/login'
            , '/logged'
            , '/logout'
            , '/main'
        ];

        var path =  $location.path();
        var intercepts = allowedAll.filter(function(el) { return el == path}).length;
        if (!intercepts) {
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
}]);

inbuApp.run(['$rootScope', function($rootScope) {
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

