// import L from 'leaflet';
// enable rotationAngle and rotationOrigin support on BM.Marker
// import 'leaflet-rotatedmarker';

/**
* Defines several classes of symbol factories,
* to be used with BM.PolylineDecorator
*/

BM.Symbol = BM.Symbol || {};

/**
* A simple dash symbol, drawn as a Polyline.
* Can also be used for dots, if 'pixelSize' option is given the 0 value.
*/
BM.Symbol.Dash = BM.Class.extend({
    options: {
        pixelSize: 10,
        pathOptions: {}
    },

    initialize: function (options) {
        BM.Util.setOptions(this, options);
        this.options.pathOptions.clickable = false;
    },

    buildSymbol: function (dirPoint, latLngs, map, index, total) {
        const opts = this.options;
        const d2r = Math.PI / 180;

        // for a dot, nothing more to compute
        if (opts.pixelSize <= 1) {
            return BM.polyline([dirPoint.latLng, dirPoint.latLng], opts.pathOptions);
        }

        const midPoint = map.project(dirPoint.latLng);
        const angle = (-(dirPoint.heading - 90)) * d2r;
        const a = BM.point(
            midPoint.x + opts.pixelSize * Math.cos(angle + Math.PI) / 2,
            midPoint.y + opts.pixelSize * Math.sin(angle) / 2
        );
        // compute second point by central symmetry to avoid unecessary cos/sin
        const b = midPoint.add(midPoint.subtract(a));
        return BM.polyline([map.unproject(a), map.unproject(b)], opts.pathOptions);
    }
});

BM.Symbol.dash = function (options) {
    return new BM.Symbol.Dash(options);
};

BM.Symbol.ArrowHead = BM.Class.extend({
    options: {
        polygon: false,
        pixelSize: 10,
        headAngle: 30,
        pathOptions: {
            stroke: true,
            weight: 1
        }
    },

    initialize: function (options) {
        BM.Util.setOptions(this, options);
        this.options.pathOptions.clickable = false;
    },

    buildSymbol: function (dirPoint, latLngs, map, index, total) {
        return this.options.polygon
            ? BM.polygon(this._buildArrowPath(dirPoint, map), this.options.pathOptions)
            : BM.polyline(this._buildArrowPath(dirPoint, map), this.options.pathOptions);
    },

    _buildArrowPath: function (dirPoint, map) {
        const d2r = Math.PI / 180;
        const tipPoint = map.project(dirPoint.latLng);
        const direction = (-(dirPoint.heading - 90)) * d2r;
        const radianArrowAngle = this.options.headAngle / 2 * d2r;
        const headAngle1 = direction + radianArrowAngle;
        const headAngle2 = direction - radianArrowAngle;
        const headAngle3 = direction - radianArrowAngle;
        const arrowHead1 = BM.point(
            tipPoint.x - this.options.pixelSize * Math.cos(headAngle1),
            tipPoint.y + this.options.pixelSize * Math.sin(headAngle1));
        const arrowHead2 = BM.point(
            tipPoint.x - this.options.pixelSize * Math.cos(headAngle2),
            tipPoint.y + this.options.pixelSize * Math.sin(headAngle2));
        const arrowHead3 = BM.point(
            tipPoint.x - this.options.pixelSize * Math.cos(headAngle2),
            tipPoint.y + this.options.pixelSize * Math.sin(headAngle2));
        return [
            map.unproject(arrowHead1),
            dirPoint.latLng,
            map.unproject(arrowHead2),
            map.unproject(arrowHead3)
        ];
    }
});

BM.Symbol.arrowHead = function (options) {
    return new BM.Symbol.ArrowHead(options);
};

BM.Symbol.Marker = BM.Class.extend({
    options: {
        markerOptions: {},
        rotate: false
    },

    initialize: function (options) {
        BM.Util.setOptions(this, options);
        this.options.markerOptions.clickable = false;
        this.options.markerOptions.draggable = false;
    },

    buildSymbol: function (directionPoint, latLngs, map, index, total) {
        if (this.options.rotate) {
            this.options.markerOptions.rotationAngle = directionPoint.heading + (this.options.angleCorrection || 0);
        }
        return BM.marker(directionPoint.latLng, this.options.markerOptions);
    }
});

BM.Symbol.marker = function (options) {
    return new BM.Symbol.Marker(options);
};
