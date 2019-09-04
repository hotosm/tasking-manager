(function () {

    'use strict';

    /**
     * @fileoverview This file provides a directive for displaying an ISO8601
     * format timestamp for expert users when they hover their mouse over a
     * traditional relative timestamp; clicking on the timestamp will copy the
     * ISO8601 timestamp to the user's clipboard. Non-expert users simply see
     * the traditional relative timestamp with no additional behavior.
     */

    angular
    .module('taskingManager')
    .directive('tmTimestamp', ['moment', 'amUtcFilter', 'amLocalFilter', 'amTimeAgoFilter', 'accountService',
               function(moment, amUtcFilter, amLocalFilter, amTimeAgoFilter, accountService) {

          function link(scope, element, attrs) {
              scope.$watch(attrs.tmTimestamp, function(value) {
                  scope.originalTimestamp = value;

                  if (value) {
                      scope.relativeTimestamp = amTimeAgoFilter(amLocalFilter(amUtcFilter(value)));

                      if (isExpert()) {
                          var timestamp = moment.utc(value);
                          // If date representation can't be parsed, use it as-is.
                          if (!timestamp.isValid()) {
                              scope.isoTimestamp = value;
                          }
                          else {
                              scope.isoTimestamp = timestamp.format("YYYY-MM-DDTHH:mm:ss[Z]");
                          }
                      }
                  }
              });

              if (isExpert()) {
                  element.on('mouseenter', function(event) {
                      event.preventDefault();
                      scope.$apply(function() { scope.displayISO = true; });
                  });

                  element.on('mouseleave', function(event) {
                      event.preventDefault();
                      scope.$apply(function() { scope.displayISO = false; });
                  });

                  element.on('click', function(event) {
                      scope.$apply(function() { scope.displayISO = false; });
                  });
              }
          }

          /**
           * Returns true if the logged-in user has expert mode enabled
           */
          function isExpert() {
              return accountService.getAccount() && accountService.getAccount().isExpert;
          }

          return {
              link: link,
              scope: true,
              templateUrl: 'app/components/tm-timestamp/tm-timestamp.html',
          }
      }]);
})();
