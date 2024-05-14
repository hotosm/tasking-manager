export function updateTasksStatus(tasks, activities) {
  let newTasks = JSON.parse(JSON.stringify(tasks));
  newTasks.features.forEach((task) => {
    const activity = getActivityForTask(activities, task.properties.taskId);
    if (activity) {
      task.properties.taskStatus = activity.taskStatus;
      task.properties.actionDate = activity.actionDate;
      task.properties.actionBy = activity.actionBy;
    }
  });
  return newTasks;
}

export function getActivityForTask(activities, id) {
  try {
    return activities.activity.filter((task) => task.taskId === id)[0];
  } catch (e) {
    return null;
  }
}
