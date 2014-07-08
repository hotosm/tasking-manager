$(document).ready(function() {
  $('#assign_to').on('click', function() {
    $('#assign_to_selector').toggleClass('hide');
  });
  osmtm.users = [];
  $.getJSON(base_url + 'users.json', function(users) {
    osmtm.users = users;
    filterUsers();
  });

  function filterUsers(filter) {
    var substrRegex = new RegExp(filter, 'i');

    $('#assign_users').empty();
    var count = 0;
    var i = 0;
    while (count < 10 && i < osmtm.users.length) {
      if (substrRegex.test(osmtm.users[i])) {
        $('#assign_users').append($('<li>', {
          html: osmtm.users[i]
        }).on('click', $.proxy(function(event) {
          $.ajax({
            url: base_url + "project/" + project_id + "/task/" + task_id + "/user/" + this.user,
            success: function(data){
              osmtm.project.loadTask(task_id);
            }
          });
        }, {user: osmtm.users[i]})));
        count++;
      }
      i++;
    }
  }

  $('#user_filter').on('keyup', function() {
    filterUsers($(this).val());
  });
});
