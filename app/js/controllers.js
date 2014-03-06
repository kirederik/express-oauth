'use strict';
var externMap;
/* Controllers */

/**
 * @ngdoc overview
 * @name inbu.controller
 * @description
 */

var inbuControllers = angular.module('inbu.controllers', []);

inbuControllers.controller('LoginCtrl', ['$location', '$scope', 'Auth', 'Rest', 
    function ($location, $scope, Auth, Rest) {
        window.location = "/auth";
    }
]);


inbuControllers.controller('LoggedInCtrl', ['$location', '$scope', 'Auth', 'Rest', 
    function ($location, $scope, Auth, Rest) {
        $scope.user = Rest.Auth.getInfo(function(data) {
            Auth.setUser(data);
            $location.path("/admin/newPres");
        }, function(error) {
            console.log(error)
        });
    }
]);

inbuControllers.controller('MainCtrl', ['$scope', 'Auth', 'Rest', '$location'
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

}]);


inbuControllers.controller('LogoutCtrl', ['$scope', '$location','Auth', 'Rest'
    , function($scope, $location, Auth, Rest) {
        Auth.setUser(null);
        Rest.Auth.logout(function() {
            $location.path("/main");
        });
    }
]);


/**
 * @ngdoc controller
 * @name inbu.controller:GridCtrl
 * @description Controller for the grid page
 */
inbuControllers.controller('GridCtrl', ['$scope', '$rootScope', 'Builder', 'Rest'
    , function($scope, $rootScope, Builder, Rest) {


    $scope.user = Rest.Users.get({id: 1});

    $scope.widgetCounter = 0;
    $scope.widgets = [];
    $scope.columns = 2;

    $scope.showMap = false;
    $scope.map = $rootScope.map;
    // $scope.gridClass="span12";
    $scope.getTitle = "Titulo";
    $scope.statObj = undefined;
    $scope.message = false;
    $scope.pState = undefined;

    angular.element(document).ready(function() {
        Builder.sortable($scope);
    });

    $scope.createGridWith = function(cols, rows) {
        $scope.columns = cols;
        $scope.rows = rows;
        Builder.buildInterface($scope);
    }
    $scope.createGridWith(3, 3);
    $scope.printWidgets = function() {
        console.log($scope.widgets);
    }

    $scope.saveState = function() {
        var widgets = [];
        angular.forEach($scope.widgets, function(widget, index){
            /* Search widget order in the parent element */
            var widgetDescriptor = widget.descriptor;
            var parId = widget.descriptor.parent;
            $(parId + " > li").each(function(index, el) {
                if (el.id == widget.id) {
                    widgetDescriptor.order = index;
                    widgetDescriptor.id = "#" + widget.id;
                    widgetDescriptor.height = $("#" + widget.id).height();
                }
            });
            widgets.push(widgetDescriptor);
        });

        // for (var i = 1; i <= $scope.columns; i++) {
        //     var parent = "#grid" + i;
        //     var widget = {};
        //     $(parent + " > li").each(function(index, el) {
        //         widget.order = index;
        //         widget.parent = parent;
        //         widget.id = $(this).attr('id');
        //         widget.height = $(this).height();
        //         console.log($("#" + widget.id + "> h3"));
        //         widgets.push(widget);
        //     })
        // }
        widgets.sort(function(element, other) {
            /* Order by grid and order */
            if (element.parent < other.parent) {
                return -1;
            } else if (element.parent > other.parent) {
                return 1;
            } else return element.order - other.order;
        });

        var state = {
            columns: $scope.columns
            , map: {
                showMap: $scope.showMap
            }
            , widgets: widgets
        };

        $scope.statObj = state;
        $('#stateModal').modal();
    };

    $scope.loadState = function() {
        Rest.Interfaces.get({userId: $scope.user.id}, function(data) {
                var interface_info = data;
                Rest.Widgets.query({interfaceId: data.id}, function(data) {
                    var widgets = data
                    var myObj = {
                        columns: interface_info.columns
                        , widgets: widgets
                        , map: {
                            showMap: false
                        }
                    }
                    Builder.fromJson($scope, myObj);
                });
            },
            function(error) {
                console.log(error);
            }
        );

    };

    /**
     * @ngdoc function
     * @name inbu.controller:GridCtrl.toggleMap
     * @description Toggle map visibility
     * @param [visibility = null] {boolean} The map visibility. If null, toggle the previous visibility.
     * @param [callback = null] {function} A function to be executed after change the visibility
     */
    $scope.toggleMap = function(visibility, callback) {
        if (callback) callback();
        if(!$rootScope.bgMap) {
            // $rootScope.maps[0].updateSize();
            Builder.createBackgroundMap($scope);
            $rootScope.showMap = true;
        } else {
            console.log("toggle");
            $scope.showMap = (visibility == undefined) ? !$scope.showMap:  visibility;
            $rootScope.showMap = (visibility == undefined) ? !$rootScope.showMap :  visibility;
            /* The timeout is necessary for the completion of AngularJS event broadcast */
            setTimeout( function() {
                $rootScope.bgMap.updateSize();
            }, 100);
        }
    }
}]);

inbuControllers.controller('PopUpCtrl', ['$scope', '$rootScope', 'Builder', 'Rest', 'Utils', 'Models'
    , function($scope, $rootScope, Builder, Rest, Utils, Model) {


    $scope.interface = new Model.Interface({
        time: 50
    });
    $scope.user = Rest.Users.get({id: 1}, function(data) {
        $scope.interface.setUser(data);
        return data;
    });

    $scope.widgetCounter = 0;
    $scope.widgets = [];
    $scope.columns = 0;

    $scope.newWidget = false;
    $scope.showMap = false;

    angular.element(document).ready(function() {
        Builder.sortable($scope);
    });

    $scope.createGridWith = function(form) {
        $scope.columns = form.cols;
        $scope.rows = form.rows;
        $scope.interface.setCols(form.cols);
        $scope.interface.setRows(form.rows);
        $scope.interface.setExpTime(form.time);
        Builder.buildInterface($scope);
        // Rest.Interfaces.save($scope.interface, function(data) {
            // $scope.interface.setId(data.id);
            // $scope.interface.setId(data);
            // console.log($scope.interface);
        // })
        $scope.interface.setId(1);
    }
    $scope.createGridWith({cols: 1, rows: 1, time: 10});

    $scope.resetForm = function() {
        $scope.form = {
            bg: false,
            layers: {
                base: [],
                over: []
            }
        };
    }
    $scope.resetForm();

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
    /**
     * @ngdoc function
     * @name inbu.controller:GridCtrl.toggleMap
     * @description Toggle map visibility
     * @param [visibility = null] {boolean} The map visibility. If null, toggle the previous visibility.
     * @param [callback = null] {function} A function to be executed after change the visibility
     */
    $scope.toggleMap = function(visibility, callback) {
        if (callback) callback();
        if(!$rootScope.bgMap) {
            // $rootScope.maps[0].updateSize();
            Builder.createBackgroundMap($scope);
            $rootScope.showMap = true;
        } else {
            console.log("toggle");
            $scope.showMap = (visibility == undefined) ? !$scope.showMap:  visibility;
            $rootScope.showMap = (visibility == undefined) ? !$rootScope.showMap :  visibility;
            /* The timeout is necessary for the completion of AngularJS event broadcast */
            setTimeout( function() {
                $rootScope.bgMap.updateSize();
            }, 100);
        }
    }

    /*$scope.$watch('form.typeSelect', function() {
        if ($scope.form.bg && $scope.form.typeSelect == 0) {
            console.log("Creating new map");
            Builder.createBackgroundMap($scope);
        }
    });*/
    $scope.$watch('form', function() {
        if ($scope.form.bg && $scope.form.typeSelect == 0 && !$rootScope.bgMap) {
            Builder.createBackgroundMap($scope);
        }
    }, true);

    $scope.currentLayers = [];
    $scope.toggleLayer = function(layer, addLayer) {
        if ($scope.form.bg && $scope.form.typeSelect == 0) {
            // var trueLayer = Utils.getLayer(layer);
            if (addLayer) {
                var mlayer = new Model.Layer(layer);
                $rootScope.bgMap.addLayer(mlayer.getLayer());
                Utils.center($rootScope.bgMap);
                $scope.currentLayers.push(mlayer);
                // $rootScope.bgLayers.push(mlayer);
            } else {
                // var jsonLayer = JSON.stringify(layer);
                $($scope.currentLayers).each(function(index, l) {
                    // console.log(l.obj, layer);
                    if (l.id == layer.id) {
                        $rootScope.bgMap.removeLayer(l.getLayer());
                        // $rootScope.bgLayers.splice(index, 1);
                        $scope.currentLayers.splice(index, 1);
                    }
                })
            }
        }

    }

    $scope.buildNewWidget = function() {
        $scope.newWidget = true;

    }
    $scope.createWidget = function() {
        console.log($scope.form);
        // var widget = {
            // layers: $scope.currentLayers,
            // info: $scope.form
        // }

        console.log( $scope.interface.getId());
        var widget = {};
        if ($scope.form.bg) {
            widget.height = 0;
            widget.grid = 0;
            widget.order = 0;
            widget.intID = $scope.interface.getId();
        }
        console.log(widget);
        $scope.widgets.push(widget);
        // $scope.newWidget = false;

        var widContent = {};
        // 0 == Map
        if ($scope.form.typeSelect == 0) {
            console.log("msg");
            if ($scope.form.bg) {
                widContent.zoom = $rootScope.bgMap.getZoom();
                widContent.centerLon = $rootScope.bgMap.getCenter().lon;
                widContent.centerLat = $rootScope.bgMap.getCenter().lat;
                widContent.layers = [];
                $($scope.currentLayers).each(function(index, el) {
                    widContent.layers.push(el.id);
                });
            }
            setTimeout(function() { $rootScope.bgMap.updateSize(); }, 100);
            Rest.Maps.save({
                widget: widget,
                widContent: widContent
            });
        }

        // $scope.resetForm();

    }

    $scope.loadState = function() {
        console.log("oi")
        Rest.Widgets.get({interfaceId: $scope.interface.getId()}, function(data) {
            console.log(data);
            Builder.fromJson($scope, data);
        })
    };
}]);

inbuControllers.controller('MapCtrl', ['$scope', '$rootScope'
    , function($scope, $rootScope) {
        $scope.showMap = true;
    }
]);


inbuControllers.controller('PresCtrl', ['$scope', '$rootScope', 'Rest', '$location', 'Auth'
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
            // $scope.tile.config = !$scope.tile.config;
        }

        /* Show presentation functions */
        $scope.showPresList = function() {
            $scope.show("presList");
            $scope.presentations = Rest.Presentations.query();
            // $scope.tile.presList = !$scope.tile.presList;
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
]);

inbuControllers.controller('ConfigCtrl', ['$scope', 'Rest', '$rootScope'
    , function($scope, Rest, $rootScope) {

        $scope.formVisibility = {
            newLayer: false
        };

        /* Toogle the "label" property from formVisibility. Set the others to false */
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
]);

inbuControllers.controller('ConfigLayerCtrl', ['$scope', 'Rest', '$rootScope'
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
            //     success: true,
            //     msg: "Camada criada com sucesso"
            // });
        }
    }
]);

inbuControllers.controller('ShowPresCtrl', ['$scope', '$routeParams', 'Rest'
    , function($scope, $routeParams, Rest) {
        $scope.presentation = Rest.Presentations.getContent({id: $routeParams.id});
    }
]);

inbuControllers.controller('NewSlidesCtrl', ['$scope', '$rootScope', 'Rest', '$location', '$routeParams'
    , function($scope, $rootScope, Rest, $location, $routeParams) {
        $scope.slideCount = 0;
        $scope.slide = 0;
        $scope.selectedSlide = 0;
        $scope.contents = [];
        $scope.pres = Rest.Presentations.get({id: $routeParams.id} ,function(data) {
            // $location.path("/pres/" + data.id + "/slides");
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
                $(this).children().filter(function() {
                    return this.id.match(/tile*/);
                }).each(function() {
                    var tile = {
                        height: new Number($(this).attr("data-height")).valueOf()
                        ,width : new Number($(this).attr("data-width")).valueOf()
                        ,top   : new Number($(this).attr("data-top")).valueOf()
                        ,left  : new Number($(this).attr("data-left")).valueOf()
                    };
                    tile.content = $scope.contentFromForm($scope.contents[$(this).attr("id")]);
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

