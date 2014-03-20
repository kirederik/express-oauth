'use strict';


var sinalmetResources = angular.module("sinalmet.resources", ['ngResource'])
  .value('BASE_URL', "http://localhost:9898")
   .value('VERSION_URL', "")
   .value('HOST_BASE', "")

.factory('Constants', ['BASE_URL', 'VERSION_URL', 'HOST_BASE', '$resource'
  , function(BASE_URL, VERSION_URL, HOST_BASE, $resource) {
    return {
      RESOURCE_URL: BASE_URL + "\:9898"
    }
  }]
)

.factory('Rest', ['Constants', '$resource', function(C, $resource) {
  return {
    Auth: $resource('/auth/:info', {info: '@info'}, {
      doAuth: {method: 'GET'}
      , getInfo: {method: 'GET', params: {info: 'token'}}
      , logout: {method: 'GET', params: {info: 'logout'}}
    })
    , Users: $resource(C.RESOURCE_URL + '/users/:id', {
      id: '@id',
    }, {})
    , Interfaces: $resource(C.RESOURCE_URL + '/interfaces/:id', {id: '@'}, {})
    , Widgets: $resource(C.RESOURCE_URL + '/widgets/:id', {id: '@'}, {})
    , Slides: $resource(C.RESOURCE_URL + '/slides/:id', {id: '@'}, {})
    , Maps: $resource(C.RESOURCE_URL + '/maps/:id', {id: '@'}, {})
    , Presentations: $resource(C.RESOURCE_URL + '/presentations/:id/:resource', 
      {
        id: '@'
        , resource: '@'
      }, {
        getContent: { method: 'GET', params: {resource: 'content'} }
      }
    )
    , Layers: $resource(C.RESOURCE_URL + '/layers/:id/:resource', {
      id: '@'
      , resource: '@'
    }, {
      getTypes: {method: 'GET', isArray: true, params: {resource: 'types'}}
    })
  }
}]);