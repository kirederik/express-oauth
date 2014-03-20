'use strict';
var externMap;
/* Controllers */

/**
 * @ngdoc overview
 * @name sinalmet.controller
 * @description
 */

var sinalmetControllers = angular.module('sinalmet.controllers', [])

.controller('LoginCtrl', ['$location', '$scope', 'Auth', 'Rest', 
  function ($location, $scope, Auth, Rest) {
    window.location = "/auth";
  }
])

.controller('LoggedInCtrl', ['$location', '$scope', 'Auth', 'Rest', 
  function ($location, $scope, Auth, Rest) {
    $scope.user = Rest.Auth.getInfo(function(data) {
      Auth.setUser(data);
      $location.path("/admin/newPres");
    }, function(error) {
      console.log(error)
    });
  }
])

.controller('MainCtrl', ['$scope', 'Auth', 'Rest', '$location'
  , function($scope, Auth, Rest, $location) {
    $scope.user = Auth.getUser();

    if ($scope.user) {
      $scope.presentations = Rest.Presentations.query({userId: 1});
    };

    $scope.formVisibility = {
      presList: false
    };
    $scope.goToPres = function(pres) {
      $location.path("/pres/" + pres.id);
    }

    $scope.show = function(label) {
      angular.forEach(Object.keys($scope.formVisibility), function(key, index){
        if (key == label) 
          $scope.formVisibility[key] = !$scope.formVisibility[key];
        else
          $scope.formVisibility[key] = false;
      });
    }

    /** @TODO Deixar query dinâmico de acordo com usuário */
    $scope.showPresList = function() {
      $scope.show("presList");
      $scope.presentations = Rest.Presentations.query({userId: 1});
    }
}])

.controller('LogoutCtrl', ['$scope', '$location','Auth', 'Rest'
  , function($scope, $location, Auth, Rest) {
    Auth.setUser(null);
    Rest.Auth.logout(function() {
      $location.path("/main");
    });
  }
])

.controller('MapCtrl', ['$scope', '$rootScope'
  , function($scope, $rootScope) {
    $scope.showMap = true;
  }
])

.controller('PresCtrl', ['$scope', '$rootScope', 'Rest', '$location', 'Auth'
  , function($scope, $rootScope, Rest, $location, Auth) {
    $scope.title = "New pres";

    $scope.user = Auth.getUser();

    $scope.presentation = {};
    $scope.presentations = [];
    $scope.tile = {
      formTile: -1
    }

    $scope.formVisibility = {
      newPres: false,
      presList: false,
      config: false
    }

    $scope.pres = {
      empty: 0,
      bgMap: 1,
      bgImage: 2,
      columns: 3
    };


    $scope.show = function(label) {
      angular.forEach(Object.keys($scope.formVisibility), function(key, index){
        if (key == label) 
          $scope.formVisibility[key] = !$scope.formVisibility[key];
        else
          $scope.formVisibility[key] = false;
      });
    }

    $scope.showConfig = function() {
      $scope.show("config");
    }

    /* Show presentation functions */
    $scope.showPresList = function() {
      $scope.show("presList");
      $scope.presentations = Rest.Presentations.query();
    }

    $scope.goToPres = function(pres) {
      $location.path("/pres/" + pres.id);
    }
    /* End Show Presentation */

    $scope.resetForm = function() {
      $scope.presentation = {};
      $scope.presentation.user = $scope.users[0];
    }


    $scope.users = Rest.Users.query(function(data) {
      $scope.presentation.user = data[0];
      return data;
    });

    $scope.formNewPres = function() {
      $scope.show("newPres");
      // $scope.tile.newPres = !$scope.tile.newPres;
    }

    $scope.createNewPres = function(selected) {
      $scope.tile.formTile = ($scope.tile.formTile == selected) ? -1 : selected;
    }

    $scope.doCreate = function() {
      $scope.presentation.usrID = $scope.presentation.user.id;
      Rest.Presentations.save($scope.presentation, function(data) {
        $location.path("/admin/pres/" + data.id + "/slides");
      })
    }

    $scope.deletePres = function(pres) {
      console.log(pres);

      Rest.Presentations.remove({id : pres.id}, function(status) {
        console.log(status);
        $rootScope.toggleNotification({
          success: true,
          msg: "Apresentação deletada com sucesso"
        });
        $scope.presentations = Rest.Presentations.query();
      }, function(error) {
        $rootScope.toggleNotification({
          success: false,
          msg: "A remoção falhou. Tente novamente."
        });
      })
    }
  }
])

.controller('ConfigCtrl', ['$scope', 'Rest', '$rootScope'
  , function($scope, Rest, $rootScope) {

    $scope.formVisibility = {
      newLayer: false
    };

    // Toogle the "label" property from formVisibility. 
    // Set the others to false 
    $scope.show = function(label) {
      angular.forEach(Object.keys($scope.formVisibility), function(key, index){
        if (key == label) 
          $scope.formVisibility[key] = !$scope.formVisibility[key];
        else
          $scope.formVisibility[key] = false;
      });
    }

    $scope.newLayerForm = function() {
      $scope.show('newLayer');
      $scope.formVisibility.tmsLayer = true;
    }
  }
])

.controller('ConfigLayerCtrl', ['$scope', 'Rest', '$rootScope'
  , function($scope, Rest, $rootScope) {
    $scope.resetFormLayer = function() {
      $scope.layer = {
        // layerType: {},
        isBase: false,
        host: "",
        name: "",
        layerName: "",
        imageType: "",
        style: "",
        transparent: false,
        typeID: 1
      }

    };
    $scope.resetFormLayer();

    $scope.updateLayerType = function(){
      if ($scope.layer.layerType) {
        $scope.layer.typeID = $scope.layer.layerType.id;
        if (/^([Tt][Mm][sS])$/.test($scope.layer.layerType.description)) {
          /* TMS layer, show fields */
          $scope.formVisibility.tmsLayer = true;
        } else {
          $scope.formVisibility.tmsLayer = false;
        }
      }
    }

    /**
     * Hide or show the Layer Name / ImageType fields
     *  on new layer form, depending on the type of the selected
     */
    $scope.$watch('layer.layerType', function() {
      $scope.updateLayerType();
    });

    Rest.Layers.getTypes({}, function(data) {
      $scope.layersTypes = data;
      $scope.layer.layerType = data[0];
      $scope.updateLayerType();

    });

    /*
     * Submit a new layer
     */
    $scope.doCreateLayer = function() {
      if ($scope.layer.host.charAt($scope.layer.host.length-1) != "/") {
        $scope.layer.host += "/";
      }
      Rest.Layers.save($scope.layer, function(st) {
        $rootScope.toggleNotification({
          success: true,
          msg: "Camada criada com sucesso"
        });
      });
      // $scope.toggleNotification({
      //   success: true,
      //   msg: "Camada criada com sucesso"
      // });
    }
  }
])

.controller('ShowPresCtrl', ['$scope', '$routeParams', 'Rest', '$rootScope'
  , function($scope, $routeParams, Rest, $rootScope) {
    $scope.presentation = Rest.Presentations.getContent({id: $routeParams.id});
    $rootScope.$watch('lastUpdate', function(ov, nv) {
      $scope.lastUpdate = ($rootScope.lastUpdate) ? 
        $rootScope.lastUpdate.value : new Date();
    });
  }
])

.controller('NewSlidesCtrl', [
  '$scope', '$rootScope', 'Rest', '$location', '$routeParams'
  , function($scope, $rootScope, Rest, $location, $routeParams) {
    $scope.slideCount = 0;
    $scope.slide = 0;
    $scope.selectedSlide = 0;
    $scope.contents = [];
    $scope.pres = Rest.Presentations.get({
      id: $routeParams.id
    } ,function(data) {
      return data;
    });

    $scope.newSlide = function() {
      console.log("new slide");
    };

    $scope.contentTypes = [
      { name: "Mapa",   type: 0 }
      ,{ name: "Imagem", type: 1 }
    ];

    Rest.Layers.query({}, function(data) {
      /* Success */
      $scope.baseLayers = [];
      $scope.overLayers = [];
      $scope.selectedBaseLayers= [];
      $scope.selectedOverLayers= [];
      $(data).each(function(index, layer) {
        (layer.isBase && $scope.baseLayers.push(layer)) ||
        $scope.overLayers.push(layer);
      });
    });

    $scope.contentFromForm = function(content) {
      var toMap = function() {
        externMap = content.map;
        var tileContent = {};
        tileContent.map = true;
        tileContent.zoom = content.map.getView().getZoom();
        tileContent.centerLon = content.map.getView().getCenter()[0];
        tileContent.centerLat = content.map.getView().getCenter()[1];
        tileContent.layers = [];
        $(content.layers).each(function(index, el) {
          tileContent.layers.push(el.id);
        });
        return tileContent;
      };
      switch (content.form.typeSelect) {
        case 0:
          // Map
          return toMap();
          break;
        case 1:
          // Image
          break;
        default:
          break;
      }
    };

    $scope.save = function() {
      // The order from slide selector
      var slideSelector = $("#slide-selector > div");
      var slides = [];
      $(slideSelector).each(function(index, element) {
        var id = $(this).attr("id");
        slides.push($("#slide" + id));
      });
      console.log($scope.contents);
      // With the slides list, search the tiles
      $(slides).each(function() {
        var slide = {};
        slide.presID = $scope.pres.id;
        slide.time = 30;
        slide.tiles = [];
        slide.sequel = id;
        slide.title = $(slide).parent().children("h2").children("input").val();
        $(this).children().filter(function() {
          return this.id.match(/tile*/);
        }).each(function() {
          var tile = {
            height: new Number($(this).attr("data-height")).valueOf()
            ,width : new Number($(this).attr("data-width")).valueOf()
            ,top   : new Number($(this).attr("data-top")).valueOf()
            ,left  : new Number($(this).attr("data-left")).valueOf()
          };
          tile.content = $scope.contentFromForm(
            $scope.contents[$(this).attr("id")]
          );
          slide.tiles.push(tile);
          
        });
        Rest.Slides.save(slide, function(status) {
          $rootScope.toggleNotification({
            success: true,
            msg: "Slide salvo com sucesso"
          });
        });
      });
    };
  }
]);

