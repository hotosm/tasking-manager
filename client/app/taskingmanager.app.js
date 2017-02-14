'use strict';

(function () {

    angular.module('taskingManager', ['ngRoute'])
        
        .config(['$routeProvider','$locationProvider', function($routeProvider, $locationProvider) {
            
            $routeProvider
                
                .when('/', {
                    templateUrl: 'app/home/home.html'
                });

            // Enable HTML5Mode which means URLS don't have ugly hashbangs in them
            $locationProvider.html5Mode(true);
        }]);
})();