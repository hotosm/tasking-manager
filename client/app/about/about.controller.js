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
                name: 'The Austrialian Government',
                logo: './assets/img/aus-gov-logo-stacked-black.jpg',
                url: 'http://dfat.gov.au'
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
            },
            {
                name: 'thinkWhere',
                logo: './assets/img/thinkwhere_logo.png',
                url: 'http://www.thinkwhere.com/'
            },
            {
                name: 'Development Seed',
                logo: './assets/img/ds-logo-pos.svg',
                url: 'https://developmentseed.org/'
            },
            {
                name: 'Amazon Web Services',
                logo: './assets/img/Powered-by-Amazon-Web-Services.png',
                url: 'https://aws.amazon.com'
            }
        ]
    }
})();
