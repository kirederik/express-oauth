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
  }]);