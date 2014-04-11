function projectCrtl($scope) {
  $scope.projects = projects;
  $scope.sortExpression = 'priority';
}
angular.module('projects', []).
  filter("timeAgo", function() {
    return function(date) {
      return jQuery.timeago(date);
    };
  }).
  filter("priority", function() {
    return function(priority) {
      // i18n: use represents the localized priorities
      return priorities[priority];
    };
  });
