'use strict';

/*
 * Services
 * @author derik - derik@simepar.br
 */


/**
 * @ngdoc overview
 * @name inbu.services
 * @description
 */
var inbuServices = angular.module('inbu.services', []);


/**
 * @ngdoc factory
 * @name inbu.services:Utils
 * @description Reusable Functions
 * @method {function} center
 * @method {function} getLayer
 *  */
inbuServices.factory('Utils', [
    function() {
        return {
            /**
             * @doc method
             * @methodOf inbu.services:Utils
             * @name inbu.services:Utils#center
             * @param map A map
             * @param lon Longitude
             * @param lat Latitude
             * @description Centralize the given map in the LonLat coordinates
             * @link OpenLayers.Map.setCenter
             */
            center: function(map, lon, lat) {
                map.setCenter(
                    new OpenLayers.LonLat(lon || -50, lat || -20).transform(
                        new OpenLayers.Projection("EPSG:4326"),
                        map.getProjectionObject()
                    ), 6
                );
            }
            /**
             * @doc method
             * @methodOf inbu.services:Utils
             * @name inbu.services:Utils#getLayer
             * @param jsonLayer A Json representation of a layer, as found in DB
             * @description Creates a new OpenLayers.Layer based on the json representation
             *                of the layer.
             * @return A OpenLayers.Layer
             * @link OpenLayers.Layer
             */
            , getLayer: function(jsonLayer) {
                var wms = 2;
                var tms = 1;
                var gtype = 3;
                if(jsonLayer.typeID == gtype) {
                    return new OpenLayers.Layer.Google(
                        jsonLayer.name, {
                            type: google.maps.MapTypeId[jsonLayer.layerName]
                            , numZoomLevels: 22
                            , isBaseLayer: true
                        }
                    )
                } else {
                    var func = (jsonLayer.typeID == wms) ? OpenLayers.Layer.WMS : OpenLayers.Layer.TMS;
                    return new func(
                        jsonLayer.name
                        , (jsonLayer.host.slice(-1) != "/") ? jsonLayer.host + "/" : jsonLayer.host
                        , {
                            layername: jsonLayer.layerName
                            , type: jsonLayer.imageType
                            , isBaseLayer: false
                        }
                    );
                }
            }
        }
    }
]);

/**
 * @ngdoc factory
 * @name inbu.services:Builder
 * @description Widget Builder Service
 * @method {function} sortable
 * @method {function} buildInterface
 * @method {function} createBackgroundMap
 * @method {function} fromJson
 *  */
inbuServices.factory('Builder', ['$compile', '$rootScope', 'MapObject'
    , function($compile, $rootScope, MapObject) {
        return {
            /**
             * @doc method
             * @methodOf inbu.services:Builder
             * @name inbu.services:Builder#sortable
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
             * @methodOf inbu.services:Builder
             * @name inbu.services:Builder#createBackgroundMap
             * @description Create the background map
             */
            , createBackgroundMap: function(scope) {
                $rootScope.bgMap = new MapObject(scope).map;
            }
            /**
             * @doc method
             * @methodOf inbu.services:Builder
             * @name inbu.services:Builder#createMapInTile
             * @description Create a map in a Tile
             */
            , createMapInTile: function(scope, tile, attrs) {
                var map = new MapObject(scope, tile, attrs).map;
                return map;
            }
            /**
             * @doc method
             * @methodOf inbu.services:Builder
             * @name inbu.services:Builder#loadMapInTile
             * @description Load a map in a Tile
             */
            , loadMapInTile: function(tile, json) {
                var map = new MapObject(null, tile, null, null, json).map;
                return map;
            }
            /**
             * @doc method
             * @methodOf inbu.services:Builder
             * @name inbu.services:Builder#buildInterface
             * @description Build the grid interface
             */
            , buildInterface: function(scope) {
                var columns = new Number(scope.interface.columns);
                var rows = new Number(scope.interface.rows);

                // The main grid is divided in 12 columns and
                // the class represents in how many columns the grid should span
                var colClass =  "span" + 12 / columns;

                // Remove all the previous grids
                $("#gridArea >").remove();

                // Append the grids in the line
                for(var row = 1; row <= rows; row++) {
                    var line = $("<div class='line row-fluid' id='row" + row + "' />");
                    for (var col = 1; col <= columns; col++) {
                        $(line).append("<ul class=\"grid columnSortable " +
                            colClass +"\" id=\"grid" + row + "" + col + "\"></ul>");
                    }
                    $("#gridArea").append(line);
                }

                // Make the grid sortable
                // @link inbu.services:Builder#sortable
                this.sortable(scope);
            }
            /**
             * @doc method
             * @methodOf inbu.services:Builder
             * @name inbu.services:Builder#slideFromJson
             * @description Given a Json that represents a slide, recover the slide
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
             * @methodOf inbu.services:Builder
             * @name inbu.services:Builder#fromJson
             * @description Given a Json that represents an user interface (with all its widgets and contents),
             *  recover the interface
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
                                // $rootScope.maps[0].remove();
                                $rootScope.bgMap = new MapObject(scope, null, null, null, wid).map;
                                $rootScope.bgMap.updateSize();
                            });
                        }
                    } else {
                        var parent = "#grid" +  widget.grid
                        var ele = $compile("<widget state='"+ JSON.stringify(widget) +
                            "' id='"+widget.id+"'></widget>")(scope);
                        var content;


                        if (wid.content.mapID) {
                            // Its a map!
                            content = $compile("<map class='resizeMe' state='" +
                                JSON.stringify(wid.contentInfo) +
                                "' mapId='map-" + widget.id + "'></map>")(scope);
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
                        $(ele).children(".widget").children(".widget-content").children(".wrapper").append(content);
                        // Append the widget to the grid
                        $(parent).append(ele);

                        // Fix widget height and width
                        $("#" + widget.id + "> div").height(widget.height + 25+ "px");
                        $("#" + widget.id + "> div").width("100%");

                        if(wid.content.mapID) {
                            var map = new MapObject(scope, null, { mapid : 'map-' + widget.id }, null, wid).map;
                            $rootScope.maps.push({ map: map, layers: null });
                        }
                    }
                });
                scope.widgetCounter = scope.widgets.length;
                /* Toogle Map */

                // scope.toggleMap(el.map.showMap);
            }
        }
    }
]);

/**
 * @ngdoc factory
 * @name inbu.services:WidgetObj
 * @description An object that represents a widget on DOM
 * @property {Number} id
 * @property {Object} descriptor
 * @property {Object} actions
 * @method {function} init
 */
inbuServices.factory('WidgetObj', ['$rootScope',
    function($rootScope) {
        return function(scope, element, attrs, ctrl) {
            return {
                scope: scope
                , element: element
                , attrs: attrs
                , ctrl: ctrl
                /**
                 * @doc property
                 * @propertyOf inbu.services:WidgetObj
                 * @name inbu.services:WidgetObj#id
                 * @description The ID of this widget on DOM
                 */
                , id: undefined
                /**
                 * @doc property
                 * @propertyOf inbu.services:WidgetObj
                 * @name inbu.services:WidgetObj#descriptor
                 * @description DOM related properties of this widget
                 * @property {String} title
                 * @property {String} parent
                 */
                , descriptor: {
                    /**
                     * @doc property
                     * @propertyOf inbu.services:WidgetObj#descriptor
                     * @name inbu.services:WidgetObj#descriptor#title
                     * @description Widget title
                     */
                    title: 'Titulo'
                    /**
                     * @doc property
                     * @propertyOf inbu.services:WidgetObj#descriptor
                     * @name inbu.services:WidgetObj#descriptor#parent
                     * @description Widget parent. The grid where it is in.
                     */
                    , parent: "#grid1"
                    /* , content: false
                     , size: {}
                     , position: {}*/
                }
                , actions: {
                    editTitle: false
                    , titleSubmit: function() {
                        this.editTitle = false;
                    }
                    , edit: function(el, id) {
                        this[el] = !this[el];
                        el = "#" + el + id;
                        setTimeout(function() {$(el).focus()}, 10);

                    }
                }
                /**
                 * @doc method
                 * @methodOf inbu.services:WidgetObj
                 * @name inbu.services:WidgetObj#init
                 * @description Anonymous method that initialize the widget behavior
                 */
                , init: (
                    function (element, scope, attrs) {
                        $(element).children("div").resizable({
                            alsoResize: $(element).find(".widget-content")
                            , animate: false
                            , containment: "body"
                            , handles: "s"
                            , start: function() {
                                scope.was = scope.$parent.showMap;
                                scope.$parent.showMap = true;
                                scope.$parent.$digest();
                            }
                            , stop: function() {
                                setTimeout(function() {
                                    eleme = $rootScope.maps;
                                    $($rootScope.maps).each(function(index, el) {
                                            el.updateSize();
                                        }
                                    );
                                }, 100);
                                scope.$parent.showMap = scope.was;
                                scope.$parent.$digest();
                            }
                        });
                    }
                )(element, scope, attrs)
            }
        }
    }
]);
var eleme;

/**
 * @ngdoc factory
 * @name inbu.services:MapObject
 * @description An object that represents a map on DOM
 * @property {Object} object
 * @method {function} map
 */
inbuServices.factory('MapObject', ['$rootScope', '$filter', 'Utils'
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
                 * @propertyOf inbu.services:MapObject
                 * @name inbu.services:MapObject#object
                 * @description An object that represent a map. It is used on load from database.
                */
                , object: object
                /**
                 * @doc property
                 * @propertyOf inbu.services:MapObject
                 * @name inbu.services:MapObject#map
                 * @description The OpenLayers map object
                */
                , map: (
                    function (attrs, tile, object) {
                        /* OpenLayers map */
                        var id = "map";
                        // if(attrs) id = attrs.mapid;
                        if(tile) id = $(tile).attr("id");
                        var map = new OpenLayers.Map(id, {
                            autoUpdateSize: true,
                            projection: "EPSG:4326"
                            // , projection: new OpenLayers.Projection("EPSG:4326")
                            // displayProjection: new OpenLayers.Projection("EPSG:4326")
                        });

                        // OpenLayers.Projection.addTransform("EPSG:4326", "EPSG:900913", OpenLayers.Layer.SphericalMercator.);
                        // OpenLayers.Projection.addTransform("EPSG:900913", "EPSG:4326", OpenLayers.Layer.SphericalMercator.projectForward);
                        // var gter = new OpenLayers.Layer.Google(
                        //     "Google Terrain", {
                        //         type: google.maps.MapTypeId.TERRAIN
                        //         , numZoomLevels: 22
                        //     }
                        // );
                        // var gsat = new OpenLayers.Layer.Google(
                        //     "Google Satellite", {
                        //         type: google.maps.MapTypeId.SATELLITE
                        //         , numZoomLevels: 22
                        //     }
                        // );


                        var arrayOSM = ["http://otile1.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.jpg",
                                "http://otile2.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.jpg",
                                "http://otile3.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.jpg",
                                "http://otile4.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.jpg"];


                        var arrayAerial = ["http://otile1.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg",
                                    "http://otile2.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg",
                                    "http://otile3.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg",
                                    "http://otile4.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg"];

                        var baseOSM = new OpenLayers.Layer.OSM("MapQuest-OSM Tiles", arrayOSM);
                        var baseAerial = new OpenLayers.Layer.OSM("MapQuest Open Aerial Tiles", arrayAerial);
                        baseAerial.sphericalMercator = false;
                        var ww2 = new OpenLayers.Layer.WorldWind( "LANDSAT",
                            ["http://worldwind25.arc.nasa.gov/tile/tile.aspx?",
                            "http://worldwind26.arc.nasa.gov/tile/tile.aspx?",
                            "http://worldwind27.arc.nasa.gov/tile/tile.aspx?"], 2.25, 4,
                            {T:"105"});
                        var bluemarble = new OpenLayers.Layer.WMS(
                            "BlueMarble"
                            , "http://vmgeoserver2:8080/geoserver/wms"
                            , { layers: "simepar_basecartografica:bluemarble.B2"
                            , format: "image/png"}, {isBaseLayer: true})
                        var esat = new OpenLayers.Layer.WMS(
                            "Esat"
                            , "http://data.worldwind.arc.nasa.gov/wms"
                            // "http://vmgeoserver2:8080/geoserver/wms/gwc"
                            , {
                                layers: "esat",
                                // projection: "EPSG:4326",
                                // srs: "EPSG:4326",
                                // crs: "EPSG:4326",
                                format: "image/png"
                            },
                            {
                                isBaseLayer: true
                            }
                        );
                        map.addLayers([esat]);
                        console.log("Projection", map.getProjectionObject());

                        // If there is an object, then add the layers from him
                        if (object) {
                            var contents = object.contentInfo;
                            var layers = [];
                            $(contents).each(function(index, content) {
                                layers.push(Utils.getLayer(content));
                            });
                            map.addLayers(layers);
                        }

                        if (map.layers.length) {
                            map.setCenter(
                                new OpenLayers.LonLat(-48, -20).transform(
                                    new OpenLayers.Projection("EPSG:4326"),
                                    map.getProjectionObject()
                                ), 6
                            );
                        }

                        // map.addControl(new OpenLayers.Control.LayerSwitcher());
                        return map;
                    }
                )(attrs, tile, object)
            }
        }
    }
]);
