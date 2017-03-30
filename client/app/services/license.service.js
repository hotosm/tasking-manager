(function () {
    'use strict';
    /**
     * @fileoverview This file provides a license service
     */

    angular
        .module('taskingManager')
        .service('licenseService', [licenseService]);

    function licenseService() {

        var licenses = [];

        var service = {
            getLicenses: getLicenses,
            getLicenseForId: getLicenseForId
        };

        return service;

        /**
         * Get the licenses
         * Mockup of licenses
         * TODO: get from API
         */
        function getLicenses(){
       
            var licensesFromAPI = [
                {
                    id: 1,
                    name: 'NextView',
                    description: 'This data is licensed for use by the US Government (USG) under the NextView (NV) license and copyrighted by Digital Globe or GeoEye. The NV license allows the USG to share the imagery and Literal Imagery Derived Products (LIDP) with entities outside the USG when that entity is working directly with the USG, for the USG, or in a manner that is directly beneficial to the USG. The party receiving the data can only use the imagery or LIDP for the original purpose or only as otherwise agreed to by the USG. The party receiving the data cannot share the imagery or LIDP with a third party without express permission from the USG. At no time should this imagery or LIDP be used for other than USG-related purposes and must not be used for commercial gain. The copyright information should be maintained at all times. Your acceptance of these license terms is implied by your use.',
                    plainText: 'In other words, you may only use NextView imagery linked from this site for digitizing OpenStreetMap data for humanitarian purposes.'
                },
                {
                    id: 2,
                    name: 'Astrium/UNOSAT',
                    description: 'UNOSAT allow any INTERNET USER to use the IMAGE to develop DERIVATIVE WORKS provided that the INTERNET USER includes the DERIVATIVE WORKS he/she created in the OpenStreetMap database under CC-BY-SA licence (http://creativecommons.org/licenses/by-sa/2.0/) and/or Open Database licence (ODbL: http://www.opendatacommons.org/licenses/odbl/), with the credit of the corresponding PRODUCT conspicuously displayed and written in full, in order to allow any OpenStreetMap database user to have access to and to use the DERIVATIVE WORKS. Except for the foregoing, the END USER and/or the INTERNET USER shall not be entitled to sell, distribute, assign, dispose of, lease, sublicense or transfer, directly or indirectly, any DERIVATIVE WORKS to any third party.All rights not expressly granted by Astrium GEO-Information Services under the present Article 2.1 are hereby retained by Astrium GEO-Information Services.',
                    plainText: 'Astrium GEO-Information Services and UNOSAT are allowing access to this imagery for creating information in OpenStreetMap. Other uses are not allowed.'
                },
                {
                    id: 3,
                    name: 'Hai Phong Satellite Imagery',
                    description: 'I will just use this satellite imagery for digitizing data in OpenStreetMap',
                    plainText: 'I will just use this satellite imagery for digitizing data in OpenStreetMap'
                },
                {
                    id: 4,
                    name: 'Public Domain',
                    description: 'This imagery is in the public domain.',
                    plainText: 'This imagery is in the public domain.'
                },
                {
                    id: 5,
                    name: 'Airbus DS / OSM-FR',
                    description: 'Airbus DS has granted OSM-FR a license to allow any INTERNET USER to use the IMAGE to develop DERIVATIVE WORKS provided that the INTERNET USER includes the DERIVATIVE WORKS he/she created in the OpenStreetMap database under Open Database licence (ODbL: http://www.opendatacommons.org/licenses/odbl/), with the credit of the corresponding PRODUCT conspicuously displayed and written in full, in order to allow any OpenStreetMap database user to have access to and to use the DERIVATIVE WORKS. Except for the foregoing, the END USER and/or the INTERNET USER shall not be entitled to sell, distribute, assign, dispose of, lease, sublicense or transfer, directly or indirectly, any DERIVATIVE WORKS to any third party.  http://imagery.openstreetmap.fr/airbus-ds/Web%20Licence%20for%20Non-Commercial%20Use%20with%20OSM.pdf',
                    plainText: 'Airbus DS Geo and OSM-FR are allowing access to the following imagery for creating information in OpenStreetMap. Copyright and attribution should be displayed as follow : For PLEIADES © CNES 2014, Distribution Airbus DS. For SPOT 6 & 7 : © Airbus DS 2014. Other uses are not allowed.'
                }
            ];
            licenses = licensesFromAPI;
            return licenses;
        }

        /**
         * Get the license for the ID
         * @param id - license id
         * @returns {*}
         */
        function getLicenseForId(id){
            if (licenses) {
                for (var i = 0; i < licenses.length; i++) {
                    if (licenses[i].id == id) {
                        return licenses[i];
                    }
                }
            }
            return [];
        }
    }
})();