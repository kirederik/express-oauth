'use strict';


/* Models */

/**
 * @ngdoc overview
 * @name inbu.models
 * @description All the models
 */
var inbuModels = angular.module('inbu.models', []);

inbuModels.factory('Models', [
	function() {
		return {
			inherit: function(cls, superCls) {
			    var construct = function () {};
			    construct.prototype = superCls.prototype;
			    cls.prototype = new construct;
			    cls.prototype.constructor = cls;
			    cls.super = superCls;
			}
			, Interface: (function() {
				var cls = function(obj) {
					this.id = null;
					this.usrID = obj.usrID || null;
					this.columns = obj.columns || null;
					this.rows = obj.rows || null;
					this.time = obj.time || null;
					this.user = null;
				};
				cls.prototype.setUser = function(user) {
					this.usrID = user.id;
					this.user = user;
				};
				cls.prototype.setExpTime = function(time) {
					this.time = time;
				};
				cls.prototype.setCols = function(cols) {
					this.columns = cols;
				};
				cls.prototype.setRows = function(rows) {
					this.rows = rows;
				};
				cls.prototype.setId = function(id) {
					this.id = id;
				}
				cls.prototype.getId = function() {
					return this.id;
				};
				return cls;
			})()
			, Widget: (function() {
				var cls = function(obj) {
					this.height = obj.height || null;
					this.grid = obj.grid || null;
					this.order = obj.order || null;
					this.intID = obj.intID || null;
				}
				return cls;
			})()
			, WidgetsContent: (function(){
				var cls = function() {
					this.imageID = obj.imageID || null;
					this.mapID = obj.mapID || null;
					this.widID = obj.widID || null;
				}
				return cls;
			})()
			, Layer: (function() {
				var cls = function(layer) {
					this.host = layer.host || null;
					this.id = layer.id || null;
					this.imageType = layer.imageType || "image/png";
					this.isBase = layer.isBase || false;
					this.layerName = layer.layerName || null;
					this.name = layer.name || null;
					this.typeID = layer.typeID || null;
					this.style = layer.style || "";
					this.transparent = layer.transparent || false;
					console.log(">>>>>", layer);
					this.olLayer = (function(that) {
			    	    var tms = 1;
						var wms = 2;
			    	    var gtype = 3;

			    	    if(that.typeID == gtype) {
			    	    	// return new OpenLayers.Layer.OSM();
			    	        return new ol.layer.Tile({
						        source: new ol.source.MapQuestOSM({layer: 'sat'})
						    })
			    	    } else {
			    	        if (that.typeID == wms) {
								return new ol.layer.Image({
									source: new ol.source.ImageWMS({
										url: that.host
										, params: {
											LAYERS:  that.layerName
											, FORMAT: that.imageType
											, TRANSPARENT: that.transparent
											, STYLES: that.style
											, SRS: "EPSG:3857"
										}
									})
								});
			    	        } else {
			    	        	return new OpenLayers.Layer.TMS(
				    	            "Base TMS"
				    	            , "http://otile2.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg"
				    	            , {
				    	                layername: ""
				    	                , type: "" 
				    	                , isBaseLayer: true
				    	            }
				    	        );
			    	        }
			    	    }
					})(this)

					// this.olLayer = this.get_layer();
				}
				cls.prototype.getLayer = function() {
					return this.olLayer;
				}
				return cls;
			})()
		}
	}
]);
