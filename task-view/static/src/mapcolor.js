/*
  All color / map style definitions go here
*/

export const DIFF_COLORS = {
  added: d3.rgb(131, 255, 158),
  removed: d3.rgb(244, 88, 70),
  changed: d3.rgb(0, 253, 255),
  unchanged: d3.rgb(151, 151, 151)
}

export const MAP_COLORS = {
  connected_node: d3.rgb(255, 255, 255),
  unconnected_node: d3.rgb(255, 255, 255),
  tertiary: d3.rgb('#1b9e77'),
  unclassified: d3.rgb('#d95f02'),
  residential: d3.rgb('#7570b3'),
  service: d3.rgb('#e7298a'),
  track: d3.rgb('#66a61e'),
  unknown: d3.rgb(216, 216, 216)
}

export const CONNECTED_NODE_RADIUS = 2.5;
export const NON_FB_OPACITY = 0.4;

// maps [r, g, b, a] to the type
// this may not be necessary actually
export const colorsIn = (function() {
    function rgbToPixelString(rgb) {
        return `${rgb.r},${rgb.g},${rgb.b},255`;
    }

    var colorsIn = {
        '0,0,0,0': null
    };

    colorsIn[rgbToPixelString(MAP_COLORS.tertiary)] = 'tertiary';
    colorsIn[rgbToPixelString(MAP_COLORS.unclassified)] = 'unclassified';
    colorsIn[rgbToPixelString(MAP_COLORS.residential)] = 'residential';
    colorsIn[rgbToPixelString(MAP_COLORS.service)] = 'service';
    colorsIn[rgbToPixelString(MAP_COLORS.track)] = 'track';

    return colorsIn;
})();

// helper function for map colors
export function roadColor(highwayType) {
  return (MAP_COLORS[highwayType] || MAP_COLORS.unknown).toString();
}
