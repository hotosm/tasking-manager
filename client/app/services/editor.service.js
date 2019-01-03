(function () {
    'use strict';
    /**
     * @fileoverview This file provides a editor helper service
     */

    angular
        .module('taskingManager')
        .service('editorService', ['$window', '$location', '$q', 'mapService', 'configService', editorService]);

    var JOSM_COMMAND_TIMEOUT = 1000;
    var josmLastCommand = 0;

    function editorService($window, $location, $q, mapService, configService) {

        var service = {
            sendJOSMCmd: sendJOSMCmd,
            launchFieldPapersEditor: launchFieldPapersEditor,
            launchPotlatch2Editor: launchPotlatch2Editor,
            launchIdEditor: launchIdEditor,
            getGPXUrl: getGPXUrl,
            getOSMXMLUrl: getOSMXMLUrl,
            getProjectFileOSMXMLUrl: getProjectFileOSMXMLUrl
        };

        return service;

        /**
         * Launch the Field Papers editor
         * @param centroid
         */
        function launchFieldPapersEditor(centroid){
            var base = 'http://fieldpapers.org/compose';
            var zoom = mapService.getOSMMap().getView().getZoom();
            var url = base + '#' + [zoom, centroid[1], centroid[0]].join('/');
            $window.open(url);
        }

        /**
         * Launch the Potlatch2 editor
         * @param centroid
         */
        function launchPotlatch2Editor(centroid){
            var base = 'http://www.openstreetmap.org/edit?editor=potlatch2';
            var zoom = mapService.getOSMMap().getView().getZoom();
            var url = base + '#map='+ [zoom, roundToDecimals(centroid[1], 5), roundToDecimals(centroid[0], 5)].join('/');
            $window.open(url);
        }

        /**
         * Launch the iD editor
         * @param centroid
         * @param changesetComment
         * @param imageryUrl
         * @param projectId
         * @param taskId
         */
        function launchIdEditor(centroid, changesetComment, imageryUrl, projectId, taskId){
            var base = 'http://www.openstreetmap.org/edit?editor=id&';
            var zoom = mapService.getOSMMap().getView().getZoom();
            var url = base + '#map=' +
                        [zoom, centroid[1], centroid[0]].join('/');
            // Add changeset comment
            var changeset = ''; // default to empty string
            if (changesetComment && changesetComment !== ''){
                changeset = changesetComment;
            }
            url += '&comment=' + encodeURIComponent(changeset);
            // Add imagery
            if (imageryUrl && imageryUrl !== '') {
                // url is supposed to look like tms[22]:http://hiu...
                var urlForImagery = imageryUrl.substring(imageryUrl.indexOf('http'));
                urlForImagery = urlForImagery.replace('zoom', 'z');
                url += "&background=custom:" + encodeURIComponent(urlForImagery);
            }
            // Add GPX
            if (projectId && projectId !== '' && taskId && taskId !== '') {
                url += "&gpx=" + getGPXUrl(projectId, taskId);
            }
            $window.open(url);
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
         * Formats a set of key value pairs into a URL parameter string
         * @param params
         * @returns {string} formatted parameter string
         * @private
         */
        function formatUrlParams_(params) {
            return "?" + Object
                    .keys(params)
                    .map(function (key) {
                        return key + "=" + params[key]
                    })
                    .join("&")
        }

        /**
         * Sends a synchronous remote control command to JOSM and returns a boolean to indicate success
         * @param endpoint of the JOSM remote control endpoint
         * @param params containing key, value pairs to be used as URL parameters
         * @returns {boolean} Did JOSM Repond successfully
         */
        function sendJOSMCmd(endpoint, params) {
            var url = endpoint + formatUrlParams_(params),
                loaded,
                iframe;

            return $q(function (resolve, reject) {
                // Figure out when we can next run a command
                var wait = Math.max(josmLastCommand + JOSM_COMMAND_TIMEOUT - Date.now(), 0);

                // This remembers when we are going to run THIS command, and adds the timeout (yes, it is double-counted - this seems to be more reliable).
                josmLastCommand = Date.now() + wait + JOSM_COMMAND_TIMEOUT;

                setTimeout(function () {
                    iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.addEventListener('load', function () {
                        if (loaded === undefined) {
                            loaded = true;
                            resolve();
                            iframe.parentElement.removeChild(iframe);
                        }
                    });
                    iframe.setAttribute('src', url);
                    document.body.appendChild(iframe);
                }, wait);

                setTimeout(function () {
                    if (loaded === undefined) {
                        loaded = false;
                        reject();
                        iframe.parentElement.removeChild(iframe);
                    }
                }, wait + JOSM_COMMAND_TIMEOUT);
            });
        }

        /**
         * Format the GPX url for the project ID and taskIds
         * @param projectId
         * @param taskIds (comma separated)
         * @param as_file {true|false}
         * @returns string - gpxUrl
         */
        function getGPXUrl(projectId, taskIds, as_file){
            var gpxUrl = configService.tmAPI + '/project/' + projectId + '/tasks_as_gpx?tasks=' + taskIds + '&as_file='+(as_file?true:false) + '&filename=task.gpx';
            // If it is not a full path, then it must be relative and for the GPX callback to work it needs
            // a full URL so get the current host and append it
            // Check if it is a full URL
            var fullUrl = gpxUrl.indexOf('http');
            if (fullUrl == -1){
                // Not a full URL - so add the absolute part
                gpxUrl = $location.protocol() + '://' + $location.host() + gpxUrl;
            }
            return encodeURIComponent(gpxUrl);
        }

     /**
         * Format the GPX url for the project ID and taskIds
         * @param projectId
         * @param taskIds (comma separated)
         * @returns string - gpxUrl
         */
        function getOSMXMLUrl(projectId, taskIds){
            var osmUrl = configService.tmAPI + '/project/' + projectId + '/tasks-as-osm-xml?tasks=' + taskIds;
            // If it is not a full path, then it must be relative and for the GPX callback to work it needs
            // a full URL so get the current host and append it
            // Check if it is a full URL
            var fullUrl = osmUrl.indexOf('http');
            if (fullUrl == -1){
                // Not a full URL - so add the absolute part
                osmUrl = $location.protocol() + '://' + $location.host() + osmUrl;
            }
            return encodeURIComponent(osmUrl);
        }

        /**
         * Format the OSM url for the project files
         * @param projectId
         * @param taskId
         * @returns string - taskUrl
         */
        function getProjectFileOSMXMLUrl(projectId, taskId, file){
            var taskUrl = configService.tmAPI + '/project/' + projectId + '/project-file?tasks=' + taskId + '&file_id=' + file.id;
            // If it is not a full path, then it must be relative and for the GPX callback to work it needs
            // a full URL so get the current host and append it
            // Check if it is a full URL
            var fullUrl = taskUrl.indexOf('http');
            if (fullUrl == -1){
                // Not a full URL - so add the absolute part
                taskUrl = $location.protocol() + '://' + $location.host() + taskUrl;
            }
            return encodeURIComponent(taskUrl);
        }
    }
})();
