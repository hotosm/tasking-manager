export function updateTasksStatus(tasks, activities) {
  tasks.features.forEach(
    task => (task.properties.taskStatus = getActivityStatus(activities, task.properties.taskId)),
  );
  return tasks;
}

export function getActivityStatus(activities, id) {
  try {
    return activities.activity.filter(task => task.taskId === id)[0].taskStatus;
  } catch (e) {
    return null;
  }
}
