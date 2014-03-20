'use strict';

/* Filters */

// angular.module('myApp.filters', []).
//   filter('interpolate', ['version', function(version) {
//     return function(text) {
//       return String(text).replace(/\%VERSION\%/mg, version);
//     }
//   }]);

angular.module('sinalmet.filters', []).
  filter('titlecase', [function() {
    return function(text) {
      return (text) ? text[0].toUpperCase() + text.substr(1) : "";
    }
  }]).
  filter('hours', ['$rootScope', function($rootScope) {
    return function(date) {
      date = (date) ? new Date(date) : new Date();
      var zeroPad = function(num) {
        return ('000000000' + num).substr(-2)
      }
      return date.getHours() + "h" + zeroPad(date.getMinutes()) + "min (GMT" +
        -1 * date.getTimezoneOffset() / 60 + ")";
      }
  }]);