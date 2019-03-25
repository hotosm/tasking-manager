/*
  tools compute diffs between osm edits

  dependencies
    RoadCanvas
*/

import { getPixel } from './maputil';
import { DIFF_COLORS, colorsIn} from './mapcolor';
import { StaticMap } from './staticmap';


function compare(img1, img2, i, j) {
    // this can probably be sped up if we first cast the data
    // to 32 int arrays

    var p1 = getPixel(img1, i, j);
    var p2 = getPixel(img2, i, j);

    var c1 = colorsIn[p1];
    var c2 = colorsIn[p2];

    if (c1 && c2) {
        if (c1 == c2) {
            return DIFF_COLORS.unchanged;
        } else {
            return DIFF_COLORS.changed;
        }
    }
    if (!c1 && c2) {
        return DIFF_COLORS.added;
    }
    if (!c2 && c1) {
        return DIFF_COLORS.removed;
    }

    return null;
}

function getInputs(img1, img2, i, j) {
    var p1 = getPixel(img1, i, j);
    var p2 = getPixel(img2, i, j);

    var c1 = colorsIn[p1];
    var c2 = colorsIn[p2];

    return {
        'v1pixel': p1,
        'v2pixel': p2,
        'v1color': c1,
        'v2color': c2
    }
}

function diff(img1, img2) {
    var width = img1.width;
    var height = img1.height;
    var data = new Uint8ClampedArray(img1.data.length);

    for (var i = 0; i < width; i++) {
        for (var j = 0; j < height; j++) {
            const color = compare(img1, img2, i, j);
            if (color) {
              data[((width * j) + i) * 4] = color.r;
              data[((width * j) + i) * 4 + 1] = color.g;
              data[((width * j) + i) * 4 + 2] = color.b;
              data[((width * j) + i) * 4 + 3] = 255;
            } else {
              data[((width * j) + i) * 4] = 0;
              data[((width * j) + i) * 4 + 1] = 0;
              data[((width * j) + i) * 4 + 2] = 0;
              data[((width * j) + i) * 4 + 3] = 0;
            }
        }
    }

    return new ImageData(data, width, height);;
}


// creates a diff of two OSM fragments
export function MapDiff(width, height, projection) {
    var d = document.createElement('div');
    var img1, img2;
    var rc = new StaticMap(d, width, height, projection);

    function _diff(data1, data2, asImage) {
        var opt = {
            showConnectedNodes: false,
            lineWidth: 5,
            noTransparency: true,
            lineCap: 'butt',
            lineJoin: 'round'
        }
        rc.render(data1, opt);
        img1 = rc.getImage();
        rc.clear();
        rc.render(data2, opt);
        img2 = rc.getImage();

        var diffImg = diff(img1, img2);
        rc.ctx.putImageData(diffImg, 0, 0);

        if (asImage) {
            return rc.ctx.getImageData(0, 0, width, height);
        }

        return rc.ctx.canvas.toDataURL();
    }

    function stats(x, y) {
        var d = getInputs(img1, img2, x, y);
        d.x = x;
        d.y = y;
        return d;
    }

    var self = {};
    self.diff = _diff;
    self.stats = stats;
    return self;
}
