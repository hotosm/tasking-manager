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

        /**
         * Formats a set of key value pairs into a URL paramater string
         * @param params
         * @returns {string} formatted paramater string
         */
        function formatUrlParams(params) {
            return "?" + Object
                    .keys(params)
                    .map(function (key) {
                        return key + "=" + params[key]
                    })
                    .join("&")
        }

        /**
         * Sends a sycnhronous remote contraol command to JOSM and returns a boolean to indicate success
         * @param URL of the JOSM remote control endpoint
         * @param Object containing key,value pairs to be used as URL paramaters
         * @returns {boolean} Did JOSM Repond successfully
         */
        function sendJOSMCmd(endpoint, params) {
            // This has been implemented using XMLHTTP rather than Angular promises
            // THis was done because angular was adding request headers such that the browser was
            // preflighing the GET request with an OPTIONS requests due to CORS.
            // JOSM does not suppport the OPTIONS requests
            // After some time, we were unable to find a way to control the headrer to stop the preflighting
            // The workaround is as you see here, to use XMLHttpRequest in synchrounous mode

            var reqObj = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");//new XMLHttpRequest();
            var url = endpoint + formatUrlParams(params);
            var success = false;
            reqObj.onreadystatechange = function () {
                console.log(this.readyState);
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        success = true;
                    }
                    else {
                        success = false;
                    }
                }
            }
            try {
                //use synchronous mode.  Not ideal but should be ok since JOSM is local.
                //Otherwise callbacks would be required
                reqObj.open('GET', url, false);
                reqObj.send();
            }
            catch (e) {
                success = false;
            }
            return success;
        }

    }
})();