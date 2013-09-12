function projectCrtl($scope) {
  $scope.projects = projects;
}
angular.module('projects', []).
  filter("timeAgo", function() {
    return function(date) {
      return jQuery.timeago(date);
    };
  });
