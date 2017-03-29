(function () {
    'use strict';
    /**
     * @fileoverview This file provides a editor helper service
     */

    angular
        .module('taskingManager')
        .service('editorService', ['$http', '$location', 'mapService', editorService]);

    function editorService($http, $location, mapService) {

        var service = {
            getUrlForEditor: getUrlForEditor,
            sendJOSMCmd: sendJOSMCmd
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

        function formatUrlParams(params) {
            return "?" + Object
                    .keys(params)
                    .map(function (key) {
                        return key + "=" + params[key]
                    })
                    .join("&")
        }

        function sendJOSMCmd(endpoint, params) {
            var reqObj = new XMLHttpRequest();
            var url = endpoint + formatUrlParams(params);
            reqObj.open('GET', url, false);
            var success = false;
            reqObj.onreadystatechange = function () {
                console.log(this.readyState);
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        success = true;
                    }
                }
            }
            try {
                reqObj.send();
            }
            catch (e) {
                console.log('error');
                success = false;
            }
            finally{
                console.log('finally');
                return success;
            }

        }

    }
})();