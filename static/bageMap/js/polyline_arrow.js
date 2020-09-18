'use strict';

// import L from 'leaflet';
// import {
//     projectPatternOnPointPath,
//     parseRelativeOrAbsoluteValue,
// } from './patternUtils.js';
// import './BM.Symbol.js';

var isCoord = function isCoord(c) {
    return c instanceof BM.LatLng || Array.isArray(c) && c.length === 2 && typeof c[0] === 'number';
};

var isCoordArray = function isCoordArray(ll) {
    return Array.isArray(ll) && isCoord(ll[0]);
};

BM.PolylineDecorator = BM.FeatureGroup.extend({
    options: {
        patterns: []
    },

    initialize: function initialize(paths, options) {
        BM.FeatureGroup.prototype.initialize.call(this);
        BM.Util.setOptions(this, options);
        this._map = null;
        this._paths = this._initPaths(paths);
        this._bounds = this._initBounds();
        this._patterns = this._initPatterns(this.options.patterns);
    },

    /**
    * Deals with all the different cases. input can be one of these types:
    * array of LatLng, array of 2-number arrays, Polyline, Polygon,
    * array of one of the previous.
    */
    _initPaths: function _initPaths(input, isPolygon) {
        var _this = this;

        if (isCoordArray(input)) {
            // Leaflet Polygons don't need the first point to be repeated, but we do
            var coords = isPolygon ? input.concat([input[0]]) : input;
            return [coords];
        }
        if (input instanceof BM.Polyline) {
            // we need some recursivity to support multi-poly*
            return this._initPaths(input.getLatLngs(), input instanceof BM.Polygon);
        }
        if (Array.isArray(input)) {
            // flatten everything, we just need coordinate lists to apply patterns
            return input.reduce(function (flatArray, p) {
                return flatArray.concat(_this._initPaths(p, isPolygon));
            }, []);
        }
        return [];
    },

    // parse pattern definitions and precompute some values
    _initPatterns: function _initPatterns(patternDefs) {
        return patternDefs.map(this._parsePatternDef);
    },

    /**
    * Changes the patterns used by this decorator
    * and redraws the new one.
    */
    setPatterns: function setPatterns(patterns) {
        this.options.patterns = patterns;
        this._patterns = this._initPatterns(this.options.patterns);
        this.redraw();
    },

    /**
    * Changes the patterns used by this decorator
    * and redraws the new one.
    */
    setPaths: function setPaths(paths) {
        this._paths = this._initPaths(paths);
        this._bounds = this._initBounds();
        this.redraw();
    },

    /**
    * Parse the pattern definition
    */
    _parsePatternDef: function _parsePatternDef(patternDef, latLngs) {
        return {
            symbolFactory: patternDef.symbol,
            // Parse offset and repeat values, managing the two cases:
            // absolute (in pixels) or relative (in percentage of the polyline length)
            offset: parseRelativeOrAbsoluteValue(patternDef.offset),
            endOffset: parseRelativeOrAbsoluteValue(patternDef.endOffset),
            repeat: parseRelativeOrAbsoluteValue(patternDef.repeat)
        };
    },

    onAdd: function onAdd(map) {
        this._map = map;
        this._draw();
        this._map.on('moveend', this.redraw, this);
    },

    onRemove: function onRemove(map) {
        this._map.off('moveend', this.redraw, this);
        this._map = null;
        BM.FeatureGroup.prototype.onRemove.call(this, map);
    },

    /**
    * As real pattern bounds depends on map zoom and bounds,
    * we just compute the total bounds of all paths decorated by this instance.
    */
    _initBounds: function _initBounds() {
        var allPathCoords = this._paths.reduce(function (acc, path) {
            return acc.concat(path);
        }, []);
        return BM.latLngBounds(allPathCoords);
    },

    getBounds: function getBounds() {
        return this._bounds;
    },

    /**
    * Returns an array of ILayers object
    */
    _buildSymbols: function _buildSymbols(latLngs, symbolFactory, directionPoints) {
        var _this2 = this;

        return directionPoints.map(function (directionPoint, i) {
            return symbolFactory.buildSymbol(directionPoint, latLngs, _this2._map, i, directionPoints.length);
        });
    },

    /**
    * Compute pairs of LatLng and heading angle,
    * that define positions and directions of the symbols on the path
    */
    _getDirectionPoints: function _getDirectionPoints(latLngs, pattern) {
        var _this3 = this;

        if (latLngs.length < 2) {
            return [];
        }
        var pathAsPoints = latLngs.map(function (latLng) {
            return _this3._map.project(latLng);
        });
        return projectPatternOnPointPath(pathAsPoints, pattern).map(function (point) {
            return {
                latLng: _this3._map.unproject(BM.point(point.pt)),
                heading: point.heading
            };
        });
    },

    redraw: function redraw() {
        if (!this._map) {
            return;
        }
        this.clearLayers();
        this._draw();
    },

    /**
    * Returns all symbols for a given pattern as an array of FeatureGroup
    */
    _getPatternLayers: function _getPatternLayers(pattern) {
        var _this4 = this;

        var mapBounds = this._map.getBounds().pad(0.1);
        return this._paths.map(function (path) {
            var directionPoints = _this4._getDirectionPoints(path, pattern)
            // filter out invisible points
            .filter(function (point) {
                return mapBounds.contains(point.latLng);
            });
            return BM.featureGroup(_this4._buildSymbols(path, pattern.symbolFactory, directionPoints));
        });
    },

    /**
    * Draw all patterns
    */
    _draw: function _draw() {
        var _this5 = this;

        this._patterns.map(function (pattern) {
            return _this5._getPatternLayers(pattern);
        }).forEach(function (layers) {
            _this5.addLayer(BM.featureGroup(layers));
        });
    }
});
/*
 * Allows compact syntax to be used
 */
BM.polylineDecorator = function (paths, options) {
    return new BM.PolylineDecorator(paths, options);
};
