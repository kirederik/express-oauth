'use strict';
var lemap;
/* 
 * Services 
 * @author derik - derik@simepar.br
 */


/**
 * @ngdoc overview
 * @name sinalmet.services
 * @description
 */
var sinalmetServices = angular.module('sinalmet.services', [])


/**
 * @ngdoc factory
 * @name sinalmet.services:Utils
 * @description Reusable Functions
 * @method {function} center
 * @method {function} getLayer
 *  */
.factory('Utils', ['Models', 
  function(Models) {
    return {
      /**
       * @doc method
       * @methodOf sinalmet.services:Utils
       * @name sinalmet.services:Utils#center
       * @param map A map
       * @param lon Longitude 
       * @param lat Latitude
       * @description Centralize the given map in the LonLat coordinates
       * @link ol.getView().
       */
      center: function(map, lon, lat, zoom) {
        map.getView().getView2D().setCenter(ol.proj.transform (
          [lon ||-48, lat || -20], 
          'EPSG:4326', 
          map.getView().getView2D().getProjection()
        ), zoom || 6);
      }
      /**
       * @doc method
       * @methodOf sinalmet.services:Utils
       * @name sinalmet.services:Utils#getLayer
       * @param jsonLayer Json representation of a layer, as found in DB
       * @description Creates a new ol.Layer based on 
       *              the json representation of the layer.
       * @return A ol.Layer
       * @link ol.Layer
       */
      , getLayer: function(jsonLayer) {
        return (new Models.Layer(jsonLayer)).getLayer();
      }
    }
  }
])

/**
 * @ngdoc factory
 * @name sinalmet.services:Builder
 * @description Widget Builder Service
 * @method {function} sortable
 * @method {function} buildInterface
 * @method {function} createBackgroundMap
 * @method {function} fromJson
 *  */
.factory('Builder', ['$compile', '$rootScope', 'MapObject'
  , function($compile, $rootScope, MapObject) {
    return {
      /**
       * @doc method
       * @methodOf sinalmet.services:Builder
       * @name sinalmet.services:Builder#sortable
       * @description Make the grids sortable
       * @link jQueryUI.sortable
       */
      sortable: function(scope) {
        $(".grid").sortable({
          connectWith: ".columnSortable"
          , placeholder: "widget-placeholder"
          , appendTo: ".mainArea"
          , opacity: 0.5
          , stop: function(event, ui) {
            console.log("Sortable stop");
            // Save the element parent id
          }
        }).disableSelection();
      }
      /**
       * @doc method
       * @methodOf sinalmet.services:Builder
       * @name sinalmet.services:Builder#createBackgroundMap
       * @description Create the background map
       */
      , createBackgroundMap: function(scope) {
        $rootScope.bgMap = new MapObject(scope).map;
      }
      /**
       * @doc method
       * @methodOf sinalmet.services:Builder
       * @name sinalmet.services:Builder#createMapInTile
       * @description Create a map in a Tile
       */
      , createMapInTile: function(scope, tile, attrs) {
        var map = new MapObject(scope, tile, attrs).map;
        return map;
      }
      /**
       * @doc method
       * @methodOf sinalmet.services:Builder
       * @name sinalmet.services:Builder#loadMapInTile
       * @description Load a map in a Tile
       */
      , loadMapInTile: function(tile, json) {
        var map = new MapObject(null, tile, null, null, json).map;
        return map;
      }

      /**
       * @doc method
       * @methodOf sinalmet.services:Builder
       * @name sinalmet.services:Builder#slideFromJson
       * @description Recover the slide given a Json
       * @param s The JSON representation of a slide
       * @param element The element where the content should be rendered
       */
      , slideFromJson: function(s, element) {
        var slide = s.slide;
        var tiles = s.tiles;
        var that = this;
        element.attr("id", slide.id);
        element.attr("data-time", slide.time);

        angular.forEach(tiles, function(tile, index){
          var letile = angular.element("<div />")
            .attr("id", "tile" + slide.id + "" + index)
            .css("height", tile.tile.height + "%")
            .css("width", tile.tile.width + "%")
            .css("position", "absolute")
            .css("top", tile.tile.top + "%")
            .css("left", tile.tile.left + "%")
          element.append(letile);

          if (tile.content.mapID) {
            that.loadMapInTile(letile, tile);
          }
        });

      }
      /**
       * @doc method
       * @methodOf sinalmet.services:Builder
       * @name sinalmet.services:Builder#fromJson
       * @description Given a Json that represents an user interface
       *   (with all its widgets and contents), recover the interface
       */
      , fromJson: function(scope, el) {

        // Reset widgets from scope
        scope.widgets = [];
        scope.columns = el.columns;
        scope.rows = 3;
        this.buildInterface(scope);

        /* Add each widget to the respective grid */
        $(el.widgets).each( function(index, wid){
          // console.log(index, wid);
          var widget = wid.widget;

          // 0 == grid means background
          if (0 == widget.grid) {

            // Its a map!
            if (wid.content.mapID) {
              scope.toggleMap(false, function() {
                if($rootScope.bgMap) {
                  $rootScope.bgMap.destroy();
                  $rootScope.bgMap = undefined;
                }
                $rootScope.bgMap = new MapObject(scope, null, 
                  null, null, wid).map;
                $rootScope.bgMap.updateSize();
              });
            }
          } else {
            var parent = "#grid" +  widget.grid
            var content;
            var h = widget.height + 25+ "px";
            var ele = $compile(
              "<widget state='"+ JSON.stringify(widget) +
               "' id='"+widget.id+"'></widget>"
            )(scope);
            
            if (wid.content.mapID) {
              // Its a map!
              content = $compile(
                "<map class='resizeMe' state='" +
                JSON.stringify(wid.contentInfo) + 
                "' mapId='map-" + widget.id + "'></map>"
              )(scope);
              $(content).height(widget.height);
            } else if (wid.content.imageID) {
              // Its an image!
              content = $("<img>").attr({
                'src': wid.contentInfo.url,
                'alt': 'Content',
                'class': 'resizeMe image-content'
              });
            }

            // Append the content to the widget
            $(ele).children(".widget")
                .children(".widget-content")
                .children(".wrapper")
                .append(content);
            // Append the widget to the grid
            $(parent).append(ele);

            // Fix widget height and width
            $("#" + widget.id + "> div").height(h);
            $("#" + widget.id + "> div").width("100%");

            if(wid.content.mapID) {
              var map = new MapObject(scope, null, { 
                mapid : 'map-' + widget.id 
              }, null, wid).map;
              $rootScope.maps.push({ map: map, layers: null });
            }
          }
        });
        scope.widgetCounter = scope.widgets.length;
      }
    }
  }
])

/**
 * @ngdoc factory
 * @name sinalmet.services:MapObject
 * @description An object that represents a map on DOM
 * @property {Object} object
 * @method {function} map
 */
.factory('MapObject', ['$rootScope', '$filter', 'Utils'
  , function($rootScope, $filter, Utils) {
    // return function(scope, element, attrs, ctrl, object) {
    return function(scope, tile, attrs, ctrl, object) {
      return {
        scope: scope,
        tile: tile,
        attrs: attrs,
        ctrl: ctrl
        /**
         * @doc property
         * @propertyOf sinalmet.services:MapObject
         * @name sinalmet.services:MapObject#object
         * @description An object that represent a map. 
         *        It is used on load from database.
        */
        , object: object
        /**
         * @doc property
         * @propertyOf sinalmet.services:MapObject
         * @name sinalmet.services:MapObject#map
         * @description The OpenLayers map object
        */
        , map: (
          function (attrs, tile, object) {
            /* OpenLayers map */
            var id = "map";
            if(tile) id = $(tile).attr("id");

            var map = new ol.Map({
              layers: [
                new ol.layer.Tile({
                  // Hardcoded Base Layer
                  source: new ol.source.MapQuestOpenAerial()
                })
              ],
              view: new ol.View2D({
                center: [0, 0],
                zoom: 2
              }),
              target: id,
              renderer: 'dom'
            });

            // If there is an object, then add the layers from him
            if (object) {
              var contents = object.contentInfo;
              var layers = [];

              $(contents.layers).each(function(index, content) {
                var layer = Utils.getLayer(content);
                layers.push(layer);
                map.addLayer(layer);
              });

              setInterval(function() {
                var limit = layers.length;
                for (var i=0; i<limit; i++) {
                  map.removeLayer(layers[i]);
                }
                setTimeout(
                  function() {
                    for (var i=0; i<limit; i++) {
                      map.addLayer(layers[i]);
                    }
                    $rootScope.lastUpdate = { value: new Date() };
                    $rootScope.$apply();
                  }, 100
                );
              }, 59000); // 60 sec

              map.getView().setCenter([
                contents.map.centerLon,
                contents.map.centerLat
              ]); 
              map.getView().setZoom(contents.map.zoom);
            } else {
              if (map.getLayers().length) {
                map.getView().getView2D().setCenter(
                  ol.projection.transform(
                    new ol.Coordinate(-48, -20), 
                    'EPSG:4326', 
                    map.getView().getView2D().projection
                  )
                );
              }
            }
            return map;
          }
        )(attrs, tile, object)
      }
    }
  }
]);
