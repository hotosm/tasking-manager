/**
 * Youtube Extension.
 * Uses image syntax to embed videos
 * Usage:
 * ![youtube video][http://youtu.be/dQw4w9WgXcQ]
 *
 * or
 *
 * ![youtube video][1]
 * [1]: http://youtu.be/dQw4w9WgXcQ
 */
(function (extension) {
  'use strict';

  if (showdown) {
    // global (browser or nodejs global)
    extension(showdown);
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['showdown'], extension);
  } else if (typeof exports === 'object') {
    // Node, CommonJS-like
    module.exports = extension(require('showdown'));
  } else {
    // showdown was not found so we throw
    throw Error('Could not find showdown library');
  }

}(function (showdown) {

  var svg =
      '<div class="youtube-preview" style="width:%2; height:%3; background-color:#333; position:relative;">' +
      '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' +
      '     width="100" height="70" viewBox="0 0 100 70"' +
      '     style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">' +
      '    <defs>' +
      '      <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" x2="0%" y2="100%">' +
      '        <stop offset="0%" style="stop-color:rgb(229,45,49);stop-opacity:1" />' +
      '        <stop offset="100%" style="stop-color:rgb(191,23,29);stop-opacity:1" />' +
      '      </linearGradient>' +
      '    </defs>' +
      '    <rect width="100%" height="100%" rx="26" fill="url(#grad1)"/>' +
      '    <polygon points="35,20 70,35 35,50" fill="#fff"/>' +
      '    <polygon points="35,20 70,35 64,37 35,21" fill="#e8e0e0"/>' +
      '</svg>' +
      '<div style="text-align:center; padding-top:10px; color:#fff"><a href="//youtu.be/%1">youtu.be/%1</a></div>' +
      '</div>',
    iframe = '<iframe width="%2" height="%3" src="//www.youtube.com/embed/%1?rel=0" frameborder="0" allowfullscreen></iframe>',
    img = '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=" width="%2" height="%3">',
    imgRegex = /(?:<p>)?<img.*?src="(.+?)"(.*?)\/?>(?:<\/p>)?/gi,
    fullLinkRegex = /(?:(?:https?:)?(?:\/\/)?)(?:(?:www)?\.)?youtube\.(?:.+?)\/(?:(?:watch\?v=)|(?:embed\/))([a-zA-Z0-9_-]{11})/i,
    shortLinkRegex = /(?:(?:https?:)?(?:\/\/)?)?youtu\.be\/([a-zA-Z0-9_-]{11})/i;

  function parseDimensions(rest) {
    var width,
      height,
      d;

    if (rest) {
      width = (d = /width="(.+?)"/.exec(rest)) ? d[1] : '420';
      height = (d = /height="(.+?)"/.exec(rest)) ? d[1] : '315';
    }

    // add units so they can be used in css
    if (/^\d+$/gm.exec(width)) {
      width += 'px';
    }
    if (/^\d+$/gm.exec(height)) {
      height += 'px';
    }

    return {
      width: width,
      height: height
    };
  }

  /**
   * Replace with video iframes
   */
  showdown.extension('youtube', function () {
    return [
      {
        // It's a bit hackish but we let the core parsers replace the reference image for an image tag
        // then we replace the full img tag in the output with our iframe
        type: 'output',
        filter: function (text, converter, options) {
          var tag = iframe;
          if (options.smoothLivePreview) {
            tag = (options.youtubeUseSimpleImg) ? img : svg;
          }
          return text.replace(imgRegex, function (match, url, rest) {
            var d = parseDimensions(rest),
                m;
            if ((m = shortLinkRegex.exec(url)) || (m = fullLinkRegex.exec(url))) {
              return tag.replace(/%1/g, m[1]).replace('%2', d.width).replace('%3', d.height);
            } else {
              return match;
            }
          });
        }
      }
    ];
  });
}));
