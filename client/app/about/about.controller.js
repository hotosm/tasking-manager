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
                name: 'Australia-Indonesia Facility for Disaster Reduction',
                logo: './assets/img/aifdr-logo.png',
                url: 'https://www.aifdr.org'
            },
            {
                name: 'USAID GeoCenter and Office of Transition Initiatives',
                logo: './assets/img/usaid-logo.png',
                url: 'https://www.usaid.gov'
            },
            {
                name: 'World Bank - GFDRR',
                logo: './assets/img/gfdrr-logo.png',
                url: 'https://www.gfdrr.org'
            },
            {
                name: 'American Red Cross',
                logo: './assets/img/americanredcross-logo.png',
                url: 'http://www.redcross.org'
            },
            {
                name: 'The George Washington University',
                logo: './assets/img/gwu-logo.png',
                url: 'https://www.gwu.edu'
            }
        ]
    }
})();
