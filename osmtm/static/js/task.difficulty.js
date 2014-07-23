$(document).ready(function() {
  $(document).on('click', '#task_difficulty_dropdown>li>a', function() {
    var difficulty = $(this).attr('data-difficulty');
    var options = {
      url: base_url + "project/" + project_id + "/task/" + task_id + "/difficulty",
      success: function(data){
        osmtm.project.loadTask(task_id);
        if (data.msg) {
          $('#task_msg').html(data.msg).show()
          .delay(3000)
          .fadeOut();
        }
      }
    };
    if (difficulty == "0") {
      options.type = "DELETE";
    } else {
      options.url += '/' + difficulty;
    }
    $.ajax(options);
    return false;
  });
});
