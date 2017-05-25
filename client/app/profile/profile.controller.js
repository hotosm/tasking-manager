(function () {

    'use strict';

    /**
     * Profile controller which manages the user profiles
     */
    angular
        .module('taskingManager')
        .controller('profileController', ['$routeParams', '$location', '$window', 'accountService','mapService','projectMapService','userService', 'geospatialService', 'messageService', profileController]);

    function profileController($routeParams, $location, $window, accountService, mapService, projectMapService, userService, geospatialService, messageService) {

        var vm = this;
        vm.username = '';
        vm.currentlyLoggedInUser = null;
        vm.userDetails = null;
        vm.osmUserDetails = null;
        vm.projects = [];
        vm.map = null;
        vm.highlightSource = null;
        vm.errorSetRole = false;
        vm.errorSetLevel = false;
        vm.errorSetContactDetails = false;
        vm.verificationEmailSent = false;
        vm.errorVerificationEmailSent = false;

        // Edit user details
        vm.editDetails = false;

        activate();

        function activate() {
            vm.username = $routeParams.id;
            setUserDetails();
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
            projectMapService.initialise(vm.map);
            projectMapService.createPopup();
            getUserProjects();
        }

        /**
         * Set user details by calling the APIs
         */
        function setUserDetails() {
            // Get account details from account service
            getUser();

            // Get OSM account details from account service
            var osmDetailsPromise = userService.getOSMUserDetails(vm.username);
            osmDetailsPromise.then(function (data) {
                // On success, set the OSM account details for this user
                vm.osmUserDetails = data;
            })
        }

        /**
         * Gets the user's project
         */
        function getUserProjects() {
            var resultsPromise = userService.getUserProjects(vm.username);
            resultsPromise.then(function (data) {
                vm.projects = data.mappedProjects;
                // iterate over the projects and add the center of the project as a point on the map
                for (var i = 0; i < vm.projects.length; i++) {
                    projectMapService.showProjectOnMap(vm.projects[i], vm.projects[i].centroid);
                }
            }, function () {
                vm.projects = [];
            });
        }

        /**
         * Set the user's role
         * @param role
         */
        vm.setRole = function (role) {
            vm.errorSetRole = false;
            var resultsPromise = userService.setRole(vm.username, role);
            resultsPromise.then(function (data) {
                getUser();
            }, function (data) {
                vm.errorSetRole = true;
            });
        };

        vm.setLevel = function(level){
            vm.errorSetLevel = false;
            var resultsPromise = userService.setLevel(vm.username, level);
            resultsPromise.then(function(data) {
               getUser();
            }, function(){
                vm.errorSetLevel = true;
            });
        };

        /**
         * Get the user's details from the account service
         */
        function getUser() {
            var resultsPromise = accountService.getUser(vm.username);
            resultsPromise.then(function (data) {
                // On success, set the account details for this user
                vm.userDetails = data;
                // Get the account for the currently logged in user
                var account = accountService.getAccount();
                if (account) {
                    vm.currentlyLoggedInUser = account;
                }
            }, function () {
                // Could not find the user, redirect to the homepage
                $location.path('/');
            });
        }

        /**
         * Set contact details
         */
        vm.setContactDetails = function(){
            vm.errorSetContactDetails = false;
            var contactDetails = {
                emailAddress: vm.userDetails.emailAddress,
                facebookId: vm.userDetails.facebookId,
                linkedinId: vm.userDetails.linkedinId,
                twitterId: vm.userDetails.twitterId
            };
            var resultsPromise = userService.setContactDetails(contactDetails);
            resultsPromise.then(function (data) {
                // Successfully saved
                vm.editDetails = false;
                vm.verificationEmailSent = data.verificationEmailSent;
                getUser();
            }, function () {
                vm.editDetails = false;
                vm.errorSetContactDetails = true;
                getUser();
            });
            vm.editDetails = false;
        };

        /**
         * Resend the email verification email
         */
        vm.resendVerificationEmail = function(){
            vm.errorVerificationEmailSent = false;
            var resultsPromise = messageService.resendEmailVerification();
            resultsPromise.then(function (data) {
                // Successfully saved
                vm.verificationEmailSent = true;
                getUser();
            }, function () {
                vm.verificationEmailSent = false;
                vm.errorVerificationEmailSent = true;
                getUser();
            });
        };

        /**
         * View project for user and bounding box in Overpass Turbo
         * @param bboxArray
         */
        vm.viewOverpassTurbo = function (aoi) {
            var feature = geospatialService.getFeatureFromGeoJSON(aoi);
            var olExtent = feature.getGeometry().getExtent();
            var bboxArray = geospatialService.transformExtentToLatLonArray(olExtent);
            var bbox = 'w="' + bboxArray[0] + '" s="' + bboxArray[1] + '" e="' + bboxArray[2] + '" n="' + bboxArray[3] + '"';
            var queryPrefix = '<osm-script output="json" timeout="25"><union>';
            var querySuffix = '</union><print mode="body"/><recurse type="down"/><print mode="skeleton" order="quadtile"/></osm-script>';
            var queryMiddle = '<query type="node"><user name="' + vm.username + '"/><bbox-query ' + bbox + '/></query>' +
                '<query type="way"><user name="' + vm.username + '"/><bbox-query ' + bbox + '/></query>' +
                '<query type="relation"><user name="' + vm.username + '"/><bbox-query ' + bbox + '/></query>';
            var query = queryPrefix + queryMiddle + querySuffix;
            $window.open('http://overpass-turbo.eu/map.html?Q=' + encodeURIComponent(query));
        }
    }
})();
