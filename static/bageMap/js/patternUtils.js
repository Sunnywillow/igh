'use strict';

// functional re-impl of BM.Point.distanceTo,
// with no dependency on Leaflet for easier testing
function pointDistance(ptA, ptB) {
    var x = ptB.x - ptA.x;
    var y = ptB.y - ptA.y;
    return Math.sqrt(x * x + y * y);
}

var computeSegmentHeading = function computeSegmentHeading(a, b) {
    return (Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90 + 360) % 360;
};

var asRatioToPathLength = function asRatioToPathLength(_ref, totalPathLength) {
    var value = _ref.value,
        isInPixels = _ref.isInPixels;
    return isInPixels ? value / totalPathLength : value;
};

function parseRelativeOrAbsoluteValue(value) {
    if (typeof value === 'string' && value.indexOf('%') !== -1) {
        return {
            value: parseFloat(value) / 100,
            isInPixels: false
        };
    }
    var parsedValue = value ? parseFloat(value) : 0;
    return {
        value: parsedValue,
        isInPixels: parsedValue > 0
    };
}

var pointsEqual = function pointsEqual(a, b) {
    return a.x === b.x && a.y === b.y;
};

function pointsToSegments(pts) {
    return pts.reduce(function (segments, b, idx, points) {
        // this test skips same adjacent points
        if (idx > 0 && !pointsEqual(b, points[idx - 1])) {
            var a = points[idx - 1];
            var distA = segments.length > 0 ? segments[segments.length - 1].distB : 0;
            var distAB = pointDistance(a, b);
            segments.push({
                a: a,
                b: b,
                distA: distA,
                distB: distA + distAB,
                heading: computeSegmentHeading(a, b)
            });
        }
        return segments;
    }, []);
}

function projectPatternOnPointPath(pts, pattern) {
    // 1. split the path into segment infos
    var segments = pointsToSegments(pts);
    var nbSegments = segments.length;
    if (nbSegments === 0) {
        return [];
    }

    var totalPathLength = segments[nbSegments - 1].distB;

    var offset = asRatioToPathLength(pattern.offset, totalPathLength);
    var endOffset = asRatioToPathLength(pattern.endOffset, totalPathLength);
    var repeat = asRatioToPathLength(pattern.repeat, totalPathLength);

    var repeatIntervalPixels = totalPathLength * repeat;
    var startOffsetPixels = offset > 0 ? totalPathLength * offset : 0;
    var endOffsetPixels = endOffset > 0 ? totalPathLength * endOffset : 0;

    // 2. generate the positions of the pattern as offsets from the path start
    var positionOffsets = [];
    var positionOffset = startOffsetPixels;
    do {
        positionOffsets.push(positionOffset);
        positionOffset += repeatIntervalPixels;
    } while (repeatIntervalPixels > 0 && positionOffset < totalPathLength - endOffsetPixels);

    // 3. projects offsets to segments
    var segmentIndex = 0;
    var segment = segments[0];
    return positionOffsets.map(function (positionOffset) {
        // find the segment matching the offset,
        // starting from the previous one as offsets are ordered
        while (positionOffset > segment.distB && segmentIndex < nbSegments - 1) {
            segmentIndex++;
            segment = segments[segmentIndex];
        }

        var segmentRatio = (positionOffset - segment.distA) / (segment.distB - segment.distA);
        return {
            pt: interpolateBetweenPoints(segment.a, segment.b, segmentRatio),
            heading: segment.heading
        };
    });
}

/**
* Finds the point which lies on the segment defined by points A and B,
* at the given ratio of the distance from A to B, by linear interpolation.
*/
function interpolateBetweenPoints(ptA, ptB, ratio) {
    if (ptB.x !== ptA.x) {
        return {
            x: ptA.x + ratio * (ptB.x - ptA.x),
            y: ptA.y + ratio * (ptB.y - ptA.y)
        };
    }
    // special case where points lie on the same vertical axis
    return {
        x: ptA.x,
        y: ptA.y + (ptB.y - ptA.y) * ratio
    };
}

// export {
//     projectPatternOnPointPath,
//     parseRelativeOrAbsoluteValue,
//     // the following function are exported only for unit testing purpose
//     computeSegmentHeading,
//     asRatioToPathLength,
// };
