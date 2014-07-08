$(document).ready(function() {
  $('#assign_to').on('click', function() {
    $('#assign_to_selector').toggleClass('hide');
  });

  function filterUsers(filter) {
    $.getJSON(
      base_url + 'project/' + project_id + '/users',
      {q: filter},
      function(users) {
        $('#assign_users').empty();
        for (var i = 0; i < users.length; i++) {
          user = users[i];
          text = user;
          if (user == assigned_to) {
            text += ' <i class="glyphicon glyphicon-ok"></i>';
          }
          $('#assign_users').append($('<li>', {
            html: text
          }).on('click', $.proxy(function(event) {
            $.ajax({
              url: base_url + "project/" + project_id + "/task/" + task_id + "/user/" + this.user,
              success: function(data){
                osmtm.project.loadTask(task_id);
              }
            });
          }, {user: user})));
        }
      }
    );
  }

  $('#user_filter').on('keyup', function() {
    filterUsers($(this).val());
  });
  filterUsers('');
});
