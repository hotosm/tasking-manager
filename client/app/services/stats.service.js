(function () {
    'use strict';
    /**
     * @fileoverview This file provides a stats service.
     */

    angular
        .module('taskingManager')
        .service('statsService', ['$http', '$q','configService', 'authService', statsService]);

    function statsService($http, $q, configService, authService) {

        var service = {
            getProjectContributions: getProjectContributions,
            getProjectActivity: getProjectActivity,
            getProjectOverview: getProjectOverview,
            getProjectStats: getProjectStats,
            getHomePageStats: getHomePageStats
        };

        return service;

          /**
         * Get project contributions
         * @param projectId
         * @returns {!jQuery.Promise|!jQuery.jqXHR|*|!jQuery.deferred}
         */
        function getProjectContributions(projectId){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/stats/project/' + projectId + '/contributions'
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }

        /**
         * Get the latest project overview. This method performs double-duty,
         * handling both single project and all-project overview (with optional
         * project filter)
         * @param projectId
         * @param page - optional
         * @returns {!jQuery.deferred|!jQuery.jqXHR|*|!jQuery.Promise}
         */
        function getProjectOverview(projectId, page, pageSize, sortBy, sortDirection, mapperNameFilter, validatorNameFilter, statusFilter, projectFilter){
            var params = '?pageSize=' + (pageSize ? pageSize : '10');
            if (page) {
                params += '&page=' + page;
            }

            if (mapperNameFilter) {
                params += "&mapperName=" + encodeURIComponent(mapperNameFilter);
            }

            if (validatorNameFilter) {
                params += "&validatorName=" + encodeURIComponent(validatorNameFilter);
            }

            if (typeof statusFilter === 'number') {
                params += "&status=" + statusFilter;
            }

            // project filter for all-projects activity
            if (projectFilter) {
                params += "&projectTitle=" + encodeURIComponent(projectFilter);
            }

            if (sortBy) {
                switch(sortBy) {
                    case "updatedDate":
                        params += "&sortBy=action_date";
                        break;
                    case "taskId":
                        params += "&sortBy=id";
                        break;
                }
            }

            if (sortDirection) {
                params += '&sortDirection=' + sortDirection;
            }

            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/stats/project/' + (projectId > 0 ? projectId : 'all') + '/overview' + params,
                headers: authService.getAuthenticatedHeader(),
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }

        /**
         * Get the project activity. This method performs double-duty, handling both single
         * project stats and all-project stats (with optional project filter).
         * @param projectId
         * @param page - optional
         * @returns {!jQuery.deferred|!jQuery.jqXHR|*|!jQuery.Promise}
         */
        function getProjectActivity(projectId, page, pageSize, sortBy, sortDirection, usernameFilter, statusFilter, projectFilter){
            var params = '?pageSize=' + (pageSize ? pageSize : '10');
            if (page) {
                params += '&page=' + page;
            }

            if (usernameFilter) {
                params += "&username=" + encodeURIComponent(usernameFilter);
            }

            if (typeof statusFilter === 'number') {
                params += "&status=" + statusFilter;
            }

            // project filter for all-projects activity
            if (projectFilter) {
                params += "&projectTitle=" + encodeURIComponent(projectFilter);
            }

            if (sortBy) {
                switch(sortBy) {
                    case "actionDate":
                    case "action_date":
                        params += "&sortBy=task_history_action_date";
                        break;
                    case "actionBy":
                    case "username":
                        params += "&sortBy=username";
                        break;
                }
            }

            if (sortDirection) {
                params += '&sortDirection=' + sortDirection;
            }

            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/stats/project/' + (projectId > 0 ? projectId : 'all') + '/activity' + params,
                headers: authService.getAuthenticatedHeader(),
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }

        /**
         * Get project stats
         * @param projectId
         * @returns {*|!jQuery.deferred|!jQuery.Promise|!jQuery.jqXHR}
         */
        function getProjectStats(projectId){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/stats/project/' + projectId
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }

        /**
         * Get homepage stats
         * @returns {*|!jQuery.deferred|!jQuery.Promise|!jQuery.jqXHR}
         */
        function getHomePageStats(){
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/stats/summary'
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }
    }
})();
