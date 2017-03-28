(function () {
    'use strict';
    /**
     * @fileoverview This file provides a editor helper service
     */

    angular
        .module('taskingManager')
        .service('editorService', ['mapService', editorService]);

    function editorService(mapService) {

        var service = {
            getUrlForEditor: getUrlForEditor
        };

        return service;

        /**
         * Returns the URL for launching the editor
         * Options:
         * - bounds
         * - base
         * - centroid
         * - protocol
         * - changesetComment
         * - imageryUrl
         * @param options
         * @returns {string}
         */
        function getUrlForEditor(options) {
            var bounds = options.bounds;
            // It uses the current zoom level to pass to the editor.
            // TODO: review if this is good enough.
            var zoom = mapService.getOSMMap().getView().getZoom();
            var centroid = options.centroid;
            var changesetComment = options.changesetComment;
            var imageryUrl = options.imageryUrl;
            switch (options.protocol) {
                case 'lbrt':  // TODO
                    if (typeof imageryUrl != "undefined" && imageryUrl !== '') {
                        source = encodeURIComponent(imageryUrl);
                    } else {
                        source = "Bing";
                    }
                    return options.base + decodeURIComponent($.param({
                            left: roundToDecimals(bounds[0], 5),
                            bottom: roundToDecimals(bounds[1], 5),
                            right: roundToDecimals(bounds[2], 5),
                            top: roundToDecimals(bounds[3], 5),
                            changeset_comment: changesetComment,
                            changeset_source: source
                        }));
                case 'llz':  // TODO
                    return options.base + $.param({
                            lon: roundToDecimals(c[0], 5),
                            lat: roundToDecimals(c[1], 5),
                            zoom: zoom
                        });
                case 'id': // iD editor
                    return options.base + '#map=' +
                        [zoom, centroid[1], centroid[0]].join('/') +
                        '&comment=' + changesetComment;
                case 'fp':  // TODO
                    return options.base + '#' +
                        [zoom, centroid[1], centroid[0]].join('/');
            }
        }

        /**
         * Round to a certain amount of decimals
         * @param input
         * @param decimals
         * @returns {number}
         */
        function roundToDecimals(input, decimals) {
            var p = Math.pow(10, decimals);
            return Math.round(input * p) / p;
        }
    }
})();