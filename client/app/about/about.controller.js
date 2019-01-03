(function () {

    'use strict';

    /**
     * About controller which manages the about page
     */
    angular
        .module('taskingManager')
        .controller('aboutController', [aboutController]);

    function aboutController() {
        var vm = this;

        vm.sponsors = [
            {
                name: 'Kaart',
                logo: './assets/img/kaart17.jpg',
                url: 'https://kaart.com'
            },
            {
                name: 'Humanitarian OpenStreetMap Team',
                logo: './assets/img/hot-logo.png',
                url: 'https://www.hotosm.org'
            }
        ]
    }
})();
