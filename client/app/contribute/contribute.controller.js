(function () {

    'use strict';

    /**
     * Contribute controller which manages contributing to a project
     */
    angular
        .module('taskingManager')
        .controller('contributeController', ['mapService', contributeController]);

    function contributeController(mapService) {
        var vm = this;
        // Mock up the results. This could change but it is a start!
        vm.results = [
            {
                id: 1,
                name: 'Cyclone Enawo: Anjanazan, Madagascar 1',
                organisation: 'IFRC',
                description: 'Ipsum lorem',
                level: 'beginner',
                priority: 'urgent'
            },
            {
                id: 2,
                name: 'Missing Maps: Zambia Malaria Elimination 46',
                organisation: 'Multiple',
                description: 'Ipsum lorem ipsum lorem ipsum lorem',
                level: 'beginner',
                priority: 'high'
            },
            {
                id: 3,
                name: 'Missing Maps - Goma, RDC - Water and Sanitation',
                organisation: 'Multiple',
                description: 'Ipsum lorem ipsum lorem ipsum lorem',
                level: 'beginner',
                priority: 'high'
            },
            {
                id: 4,
                name: 'Osun State Road Network Mapping for Vaccine Delivery Routing, Nigeria',
                organisation: 'MSF',
                description: 'Ipsum lorem ipsum lorem ipsum lorem',
                level: 'beginner',
                priority: 'medium'
            },
            {
                id: 5,
                name: 'Missing Maps - Malawi - Thyolo - Blantyre (roads)',
                organisation: 'MSF',
                description: 'Ipsum lorem ipsum lorem ipsum lorem',
                level: 'beginner',
                priority: 'low'
            },
            {
                id: 6,
                name: 'Tanzania Development Trust: Maswa district mapping project part 2',
                organisation: 'MSF',
                description: 'Ipsum lorem ipsum lorem ipsum lorem',
                level: 'beginner',
                priority: 'low'
            }
        ];

        // Paging results
        vm.itemsPerPage = 4;
        vm.currentPage = 1;

        // Default to grid view
        vm.resultsView = 'grid';

        activate();

        function activate() {
            mapService.createOSMMap('map');
        }
    }
})();
