import { getPixel } from './maputil';
import {roadColor, colorsIn, MAP_COLORS, NON_FB_OPACITY, CONNECTED_NODE_RADIUS} from './mapcolor';

/*

  lightweight canvas renderer
  allows extraction of image objects

  dependencies
    d3 for projections
    color definitions
*/

// renders an OSM fragment
export function StaticMap(el, width, height, projection) {
    var self = {};
    var canvas = d3.select(el).append('canvas')
          .attr('height', height)
          .attr('width', width)
    var ctx = canvas.node().getContext('2d');

    self.canvas = canvas;
    self.ctx = ctx;
    self.projection = projection;

    function render(data, opt) {
        opt = opt || {};

        var path = d3.geoPath()
          .projection(projection)
          .context(ctx);

        data.features.filter(f => {
            return f.geometry.type !== 'Point';
        }).forEach(function(feature) {
          ctx.beginPath();
          ctx.strokeStyle = roadColor(feature.properties.highway);
          // ctx.lineWidth = feature.properties.is_fb ? 3 : 3;
          ctx.lineWidth = opt.lineWidth || 3;
          if (opt.noTransparency) {
              ctx.globalAlpha = 1.0;
          } else {
              ctx.globalAlpha = feature.properties.is_fb ? 1.0: NON_FB_OPACITY;
          }

          ctx.lineJoin = opt.lineJoin || "round";
          ctx.lineCap = opt.lineCap || "round";
          path(feature);
          ctx.stroke();
        });

        if (opt.showConnectedNodes) {
            data.features.filter(f => {
                return f.geometry.type === 'Point';
            }).forEach(function(feature) {
                var pt = projection(feature.geometry.coordinates);
                ctx.beginPath();
                ctx.strokeStyle = MAP_COLORS.connected_node;
                ctx.fillStyle = MAP_COLORS.connected_node;
                ctx.globalAlpha = 1;

                ctx.arc(
                  Math.round(pt[0]),
                  Math.round(pt[1]),
                  opt.connectedNodeRadius || CONNECTED_NODE_RADIUS,
                0,2*Math.PI);


                ctx.fill();
            });
        }
    }

    self.render = render;
    self.getImage = function() {
        return ctx.getImageData(0, 0, width, height);
    };

    self.getImageUrl = function() {
      return ctx.canvas.toDataURL();
    }

    self.clear = function() {
        ctx.clearRect(0, 0, width, height);
    };

    self.stats = function(x, y) {
        var img = ctx.getImageData(0, 0, width, height);
        var p = getPixel(img, x, y)
        return {
            'x': x,
            'y': y,
            'pixel': p,
            'colortag': colorsIn[p]
        }
    };

    return self;
}
