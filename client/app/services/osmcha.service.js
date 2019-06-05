(function () {
    'use strict';
    /**
     * @fileoverview This file provides a service for viewing changesets in OSMCha
     */

    angular
        .module('taskingManager')
        .service('osmchaService', ['$window', osmchaService]);

    function osmchaService($window) {
        var baseURL = 'https://osmcha.mapbox.com/?';

        var service = {
            viewOSMCha: viewOSMCha,
        };

        return service;

        /**
         * Open OSMCha in a new window using the given filters. Either a WSEN
         * bbox or a saved filter id are required. If a filter id is given,
         * everything else is ignored. Otherwise the bbox and all other
         * supplied filters are applied
         *
         * Supported filter fields:
         *   - filterId: id of saved OSMCha filter
         *   - bbox: array or comma-separated string of WSEN bounds
         *   - bboxSize: max multiple of bbox area to consider
         *   - usernames: array of OSM username strings
         *   - mappingTeams: array of OSMCha team name strings
         *   - startDate: moment date instance (assumed to be in UTC)
         *   - comment: changeset comment string
         */
        function viewOSMCha(filtersObject) {
            if (!filtersObject) {
                return;
            }

            // If a custom filter id is given, OSMCha ignores everything else
            if (filtersObject.filterId) {
                $window.open(baseURL + 'aoi=' + encodeURIComponent(filtersObject.filterId));
                return;
            }

            // if no filter id, then bbox is required
            if (!filtersObject.bbox) {
                return;
            }

            var filterParams = {}
            filterParams["in_bbox"] = buildFilter(typeof filtersObject.bbox === 'string' ?
                                                  filtersObject.bbox :
                                                  filtersObject.bbox.join(','));

            if (filtersObject.bboxSize) {
                filterParams["area_lt"] = buildFilter(filtersObject.bboxSize);
            }

            if (filtersObject.startDate) {
                filterParams["date__gte"] =
                    buildFilter(filtersObject.startDate.format("YYYY-MM-DD"));
            }

            if (filtersObject.usernames) {
                filterParams["users"] = buildFilter(filtersObject.usernames);
            }

            if (filtersObject.mappingTeams) {
                filterParams["mapping_teams"] = buildFilter(filtersObject.mappingTeams);
            }

            if (filtersObject.comment) {
                filterParams["comment"] = buildFilter(filtersObject.comment);
            }

            $window.open(baseURL + 'filters=' + encodeURIComponent(JSON.stringify(filterParams)));
        }

        function buildFilterValue(value) {
            return { label: value, value: value };
        }

        function buildFilter(values) {
            var valuesArray = Array.isArray(values) ? values : [values];
            return valuesArray.map(function(value) {
                return buildFilterValue(value);
            });
        }
    }
})();
