'use strict';

/*
 * Directives
 * @author derik - derik@simepar.br
 */

/**
 * @ngdoc overview
 * @name sinalmet.directives
 * @description
 */
var sinalmetDirectives = angular.module('sinalmet.directives', [])


/**
 * @ngdoc directive
 * @name sinalmet.directives:map
 * @description A Map
 * @link sinalmet.services:MapObject
 */
.directive('map', ['$rootScope', 'MapObject', 'Rest', 'Utils'
  , function($rootScope, MapObject, Rest, Utils){
  return {
    restrict: "E",
    replace: true,
    templateUrl: "partials/templates/_map.html",
    scope: {
      mapId: '='
    },
    controller: function($scope, $element) {
      $scope.addLayer = function(layer, index) {
        var maps = $rootScope.maps;
        var id = $scope.leId;
        var currentMap;
        var layers;
        if (id == "map") {
          currentMap = $rootScope.bgMap;
          var trueLayer = Utils.getLayer(layer);
          currentMap.addLayer(trueLayer);
          Utils.center(currentMap);
          $rootScope.bgLayers.push({obj: layer, layer: trueLayer});
        }
      }
    },
    link: function(scope, element, attrs, ctrl) {
      scope.leId =  (attrs && attrs.id) ? 'tile' + attrs.id : 'map';
      scope.layerSelect = false;

      $rootScope.$watch('showMap', function() {
        scope.layerSelect = $rootScope.showMap;
      });
    }
  }
}])

/**
 * @ngdoc directive
 * @name sinalmet.directives:natural
 * @description Natural number validator
 */
.directive('natural', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      var INTEGER_REGEXP = /^\-?\d*$/;
      ctrl.$parsers.unshift(function(viewValue) {
        if (!viewValue) return undefined;
        if (INTEGER_REGEXP.test(viewValue)) {
          var number = new Number(viewValue).valueOf();
          if (number < 0) {
            ctrl.$setValidity('natural', false);
            ctrl.$modelValue = "";
            return undefined;
          } else {
            ctrl.$setValidity('natural', true);
            return number;
          }
        } else {
          ctrl.$setValidity('natural', false);
          return undefined;
        }
      });
      ctrl.$formatters.push(function(viewValue) {
        var max = new Number(attrs.max).valueOf();
        var min = new Number(attrs.min).valueOf();
        var vvalue = new Number(viewValue).valueOf();
        if (INTEGER_REGEXP.test(viewValue) && 
          (vvalue > max && vvalue < min)) {
          ctrl.$setValidity('natural', true);
          return viewValue;
        } else {
          ctrl.$setValidity('natural', false);
          return undefined;
        }
      });
    }
  };
})


/**
 * @ngdoc directive
 * @name sinalmet.directives:buildSlide
 * @description Build the slide based on a json description
 */
 .directive('buildSlide', ['$compile', 'Builder'
  , function($compile, Builder){
  return {
    restrict: 'E', 
    template: '<div class="fullheight"> </div>',
    replace: true,
    link: function(scope, element, attrs, ctrl) {
      Builder.slideFromJson(scope.slide, element);
    }
  };
 }])

/**
 * @ngdoc directive
 * @name sinalmet.directives:slideBuilder
 * @description Slide selector. Contains a button that creates a new slide-tile.
 *
 * @link slideTile
 */
.directive('slideBuilder', ['$compile', function ($compile) {
  return {
    restrict: 'A',
    scope: { text: '@' },
    replace: true,
    template: '<a href="" class="slideBuilder" data-ng-click="newSlide()">' + 
      '<i class="icon-plus"></i>{{ text }}</a>',
    link: function (scope, element, attrs, ctrl) {
      // Function defined in the controller below
      scope.newSlide();
      $("#slide-selector").sortable({
        axis: "y"
      });

    }
    , controller: function ( $scope, $element ) {
      // Creates -- and compile -- a new slideTile
      $scope.newSlide = function () {
        // $parent == Main controller, as defined in the routes
        $scope.$parent.slideCount++;
        var id = $scope.$parent.slideCount;
        $scope.pcontroller = $scope.$parent;
        var el = $compile("<slide-Tile id='"+id+"'></slide-Tile>")($scope);
        $("#slide-selector").append(el);
      };
    }
  };
}])

/**
 * @ngdoc directive
 * @name sinalmet.directives:slideTile
 * @description A slide tile that can be selected on the left menu. 
 *    Compiles a new slide.
 *    On click in this directive, change the slide active in the slides area.
 * @link slide slideBuilder
 */
.directive('slideTile', ['$rootScope', '$compile'
  , function($rootScope, $compile){
    return {
      restrict: "E",
      replace: true,
      scope: {
        id: '='
      },
      template: '<div data-ng-click="changeSlide()" id=""' +
        'class="tile bg-color-white border-color-darken selected"> \
        <div class="brand fg-color-darken"> \
          Slide {{id}} \
        </div> \
      </div>'
      , link: function(scope, element, attrs, ctrl) {
        var elId = "#" + scope.$parent.pcontroller.selectedSlide;
        $(elId).removeClass("selected");
        scope.title = "Slide " + attrs.id;

        // $parent -> slideBuilder
        // $parent.pcontroller -> Main Controller
        scope.$parent.pcontroller.selectedSlide = attrs.id;

        // Compiles the slide and add to the slide area
        var slide = $compile(
          "<slide parent='" + attrs.id + 
          "' id='slide" + attrs.id + "'></slide>"
        )(scope);
        $(".fill").append(slide);
      }
      , controller: function($scope, $element, $attrs) {
        // trigger on click.
        $scope.changeSlide = function() {
          var elId = "#" + $scope.$parent.pcontroller.selectedSlide;
          $(elId).removeClass("selected");
          $("#" + $scope.id).addClass("selected");
          $scope.$parent.pcontroller.selectedSlide = $scope.id;
        };
      }
    }
  }
])

/**
 * @ngdoc directive
 * @name sinalmet.directives:tile
 * @description A Tile is a widget, its the frame that actually contains the 
 *      content of a slide. A Slide is composed by one or more tiles
 * @link slide
 */
.directive('tile', ['$rootScope', '$compile'
  , function($rootScope, $compile){
    return {
      restrict: "E",
      replace: true,
      scope: {
        id: '=',
        parent: '='
      },
      template: '<div id="" data-ng-click="select($event)"' +  
        'class="tile selected border-color-darken">' + 
        '<div class="drag-handle"><i class="icon-move fg-color-white">' +
        '</i></div></div>'
      , link: function(scope, element, attrs, ctrl) {
        // When the tile is created, give a random color to it
        var colors =  [
          "bg-color-green", "bg-color-greenDark", "bg-color-greenLight",
          "bg-color-yellow", "bg-color-darken", "bg-color-purple",
          "bg-color-teal", "bg-color-blue", "bg-color-blueDark",
          "bg-color-blueLight", "bg-color-orange", "bg-color-orangeDark",
          "bg-color-red", "bg-color-redLight", "bg-color-white"
        ];
        var colorIndex = Math.floor((Math.random()*colors.length));
        $(element).addClass(colors[colorIndex]);

        // Set some initial attributes. Its used when save the presentation
        $(element).attr("data-top", "0");
        $(element).attr("data-left", "0");
        $(element).css("position", "absolute");
        $(element).attr("data-height", 150*100/$("#" + attrs.parent).height());
        $(element).attr("data-width", 150*100/$("#" + attrs.parent).width());

        // Flag to control the drag effect. Used to keep the "selected" 
        // class when the user drag the tile
        scope.dragged = false;

        /* attrs.parent is the id of the slide that contains this tile */
        var slideId = "#" + attrs.parent;

        // Make the tile draggable
        $(element).draggable({
          containment: slideId,
          scroll: false,
          handle: '.drag-handle',
          start: function() {
            scope.dragged = true;
          },
          stop: function(event, position) {
            scope.dragged = false;
            /* $parent -> slide */
            scope.$parent.dragStop($(element), position)
          }
        });

        // Make this tile resizable
        $(element).resizable({
          /* Max{height, width} can't be bigger than the slide itself */
          maxHeight: $(slideId).height(),
          maxWidth:  $(slideId).width() ,
          start: function(e, p) {
            scope.$parent.resizeStart();
          },
          stop: function(event, position) {
            scope.$parent.resizeStop($(element), position);
          }
        });
      }
      , controller: function($scope, $element, $attrs) {
        /* Method triggered on tile click. Add the "select" class to it. */
        $scope.select = function(event) {
          if ($($element).hasClass("selected") && !$scope.dragged) {
            // $($element).addClass("selected");
            return;
          } else {
            $scope.$parent.clearSelection();
            $($element).addClass("selected");
            $scope.$parent.setSelection($element);
          }
          $scope.dragged = false;
          event.stopPropagation();
        };
      }
    }
  }
])

/**
 * @ngdoc directive
 * @name sinalmet.directives:presentation
 * @description Control the slides
 */
.directive('presentation', [ function(){

  return {
    restrict: 'A',
    replace: true,
    link: {
      post: function($scope, element, iAttrs, controller) {
        iAttrs.$observe('pres', function(value) {
          if (value) {
            $scope.ready(JSON.parse(value));
          }
        });
      }
    },
    controller: function($scope, $element, $attrs) {
      $scope.nready = 0;
      $scope.slideReady = function() {
        $scope.nready++;
      }
      $scope.ready = function(pres) {
        $scope.$watch('nready', function(ov, nv) {
          if ($scope.nready < pres.length) return;

          // Sum of times
          $scope.totalTime = 0;
          angular.forEach(pres, function(d, index) {
            $scope.totalTime += d.slide.time;
          });
          console.log("Total time = ", $scope.totalTime);
          var totalTime = $scope.totalTime;
          var toTotal = 0;
          var animate = function(slide, duration) {
            console.log(slide);
            $('html').animate({
              scrollTop: $(slide).offset().top
            }, duration, 'swing', function() {
              console.log("complete! ", new Date());
            });
          };

          // Hide / show slide animation
          var presRepeat = function(slide, currentTotal, slideTime) {
            var duration = 1000;
            var fire = (currentTotal * 1000) + duration;
            var interval = (totalTime * 1000) + duration;
            setTimeout(function() {
              // animate(slide, duration);
              $(".slides").hide();
              $(slide).show();
              console.log("Showed", slide)
              setInterval(function() {
                // animate(slide, duration);
                $(".slides").hide();
                $(slide).show();
              }, interval);
            }, fire);
          };

          angular.forEach(pres, function(slide, index){
            var id = "#pres" + index;
            var slide = slide.slide;
            presRepeat(angular.element(id), toTotal, slide.time);
            toTotal += slide.time;
          });
        });

      };
    }
  };
}])

.directive('slideControl', [ function(){
  return {
    restrict: 'A',
    link: {
      post: function($scope, element, iAttrs, controller) {
        // $scope.register(element, iAttrs);
        iAttrs.$observe('slide', function(value) {
          $scope.slideReady();
        });
      }
    }
  };
}])


/**
 * @ngdoc directive
 * @name sinalmet.directives:slide
 * @description A slide is an interface that has the tiles.
 *        A presentation contains several slides
 * @childOf slideTile
 * @link tile
 */
.directive('slide', ['$rootScope', '$compile', 'Builder', 'Models', 'Utils'
  , function($rootScope, $compile, Builder, Model, Utils){
  return {
    scope: {
      id: "=",
      parent: "="
    },
    restrict: 'E',
    replace: true,
    templateUrl: "partials/templates/_slide.html",
    link: function(scope, elem, attrs, contrl) {
      // attrs.parent -> slideTile
      scope.leid = attrs.parent;
      scope.newWidForm = false;

      // Array of tiles
      scope.tiles = [];
      scope.tilesCounter = 0;

      /*
       * Called when the user clicks on the "plus" button
       * Creates and appends a new tile in the slide area
       */
      scope.toggleForm = function(event) {
        scope.newWidForm = !scope.newWidForm;
        if (scope.newWidForm) {
          var newTile = $compile(
            "<tile parent='" + attrs.id + 
            "' id='tile" + attrs.id + scope.tilesCounter++ + "'></tile>"
          )(scope);
          $(elem).children(".selected").removeClass("selected");
          $(newTile).addClass("newTile");
          $(elem).append(newTile);
          scope.tiles.push(newTile);
        }
        else {
          scope.clearSelection();
          scope.resetForm();
        }
        event.stopPropagation();
      };

      // Empty form object
      scope.form = {
        bg: false,
        layers: {
          base: [],
          over: []
        }
      };

      // Main Controller
      scope.ctrl = scope.$parent.$parent.$parent;
    },
    controller: function($scope, $element, $attrs) {
      $scope.map = undefined;
      $scope.currentLayers = [];

      // Array containing the tiles content
      // When the page loads from db, get the value from the main controller
      // This array is indexed by the element id
      $scope.contents = $scope.$parent.$parent.$parent.contents;

      $scope.clearSelection = function() {
        console.log("removed");
        $($element).children(".selected").removeClass("selected");
        $scope.newWidForm = false;
      };

      /*
       * Watch the bg checkbox.
       * If it changes and is true, then transform the current
       *  selected tile in the background
       * Else transform the current selected tile into a tile again
       */
      $scope.$watch("form.bg", function(nv, ov) {
        if ($scope.form.bg) {
          $($element).children(".selected").css({
            "height": $($element).height() + "px",
            "width": $($element).width() + "px",
            "position": "absolute",
            "z-index": "1"
          });
          var obj = {
            size: {
              height: $($element).height(),
              width: $($element).width()
            }
          };
          $scope.resizeStop($($element).children(".selected"), obj);

        } else {
          if ($($element).children(".selected").hasClass("bkg")) {
            $($element).children(".selected").css({
              "height": "150px",
              "width": "150px",
              "position": "relative"
            });
            $($element).children(".selected").removeClass("bkg");
            var obj = {
              size: {
                height: 150,
                width: 150
              }
            };
            $scope.resizeStop($($element).children(".selected"), obj);
          }
        }
      });

      /*
       * Watchs the form type selector.
       * Changes the form accordly to the type of content
       */
      $scope.$watch("form.typeSelect", function(nv, ov) {
        /* typeSelect == 0 means that the user has choosen a map */
        if ($scope.form.typeSelect == 0) {

          // The selected tile
          var element = $($element).children(".selected");

          var map = Builder.createMapInTile($scope, element, $attrs);

          // Update the content of this tile. Its important on save
          $scope.contents[$(element).attr("id")] = {
            form: $scope.form,
            map: map,
            layers: []
          };
          $scope.updateContent();
          console.log($(element).attr("id"));
        }
      });

      $scope.resetForm = function() {
        $scope.form = {
          bg: false,
          layers: {
            base: [],
            over: []
          }
        };
      };
      $scope.resetForm();

      /* Changes the form to represent the current selected tile */
      $scope.setSelection = function(el) {
        var elemId = $(el).attr("id");
        $scope.resetForm();
        if ($scope.contents[elemId])
          $scope.form = $scope.contents[elemId].form;
        $scope.newWidForm = true;
      };

      /*
       * @ngdoc method
       * @methodOf sinalmet.directives:slide
       * @name sinalmet.directives:slide#toggleLayer
       * @description When editing a map, turn on/off the layers
       * @param layer The layer do add/remove
       * @param addLayer A boolean that choose the correct function
       */
      $scope.toggleLayer = function(layer, addLayer) {
        var elementId = $($element).children(".selected").attr("id");
        $scope.contents[elementId].form = $scope.form;
        if (addLayer) {
          var mlayer = new Model.Layer(layer);
          console.log(mlayer.getLayer());
          $scope.contents[elementId].map.addLayer(mlayer.getLayer());
          if (mlayer.typeID == 3) {
            Utils.center($scope.contents[elementId].map);
          }
          $scope.contents[elementId].layers.push(mlayer);

        } else {
          // When removing, we must find the layer
          $($scope.contents[elementId].layers).each(function(index, l) {
            if (l.id == layer.id) {
              $scope.contents[elementId].map.removeLayer(l.getLayer());
              $scope.contents[elementId].layers.splice(index, 1);
            }
          })
        }
        $scope.updateContent();
      }

      $scope.occurResize = false;

      /* Triggered on drag stop. Update the tile relative position */
      $scope.dragStop = function(element, p) {
        // For some obscure reason, when a resize occur on the tile, it's
        //   moved to top = 60 and left = 21
        if ($scope.occurResize) p.position.left = p.position.left - 21;
        if ($scope.occurResize) p.position.top = p.position.top - 60;
        var relLeft = (p.position.left * 100) / $($element).width();
        var relTop = (p.position.top * 100) / $($element).height();
        $(element).attr("data-left", relLeft);
        $(element).attr("data-top", relTop);
      }

      $scope.resizeStart = function() {};

      /* Triggered on resize stop. Update the relative height and width */
      $scope.resizeStop = function(element, p) {
        var elementId = $(element).attr("id");
        $scope.occurResize = true;

        // When a resize occur and the content of the tile is a map
        // its necessary to update the map size as well, when applied
        if ($scope.contents[elementId] && $scope.contents[elementId].map) {
          setTimeout(function() {
            $scope.contents[elementId].map.updateSize();
          }, 750);
        }

        var relHeight = ($(element).height() * 100) / $($element).height();
        var relWidth = ($(element).width() * 100) / $($element).width();
        console.log("resizing", p.size, $($element).height(), $($element).width(), relHeight, relWidth);
        $(element).attr("data-height", relHeight);
        $(element).attr("data-width", relWidth);
      };

      $scope.updateContent = function() {
        $scope.$parent.$parent.$parent.contents = $scope.contents;
      };
    }
  };
}]);