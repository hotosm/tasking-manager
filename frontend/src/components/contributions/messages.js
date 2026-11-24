import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on homepage.
 */
export default defineMessages({
  myTasks: {
    id: 'mytasks.mainSection.title',
    defaultMessage: 'My Tasks',
  },
  contribution: {
    id: 'mytasks.contribution',
    defaultMessage: 'Contribution',
  },
  all: {
    id: 'mytasks.filter.all',
    defaultMessage: 'All',
  },
  mapped: {
    id: 'mytasks.filter.mapped',
    defaultMessage: 'Mapped',
  },
  validated: {
    id: 'mytasks.filter.validated',
    defaultMessage: 'Validated',
  },
  invalidated: {
    id: 'mytasks.filter.invalidated',
    defaultMessage: 'More mapping needed',
  },
  archived: {
    id: 'mytasks.filter.archived',
    defaultMessage: 'Archived projects',
  },
  searchProject: {
    id: 'mytasks.placeholder.search_project',
    defaultMessage: 'Search by project id',
  },
  noMatchingProjectId: {
    id: 'mytasks.placeholder.noMatchingProjectId',
    defaultMessage: 'No matching project ID',
  },
  projects: {
    id: 'mytasks.filter.projects',
    defaultMessage: 'Projects',
  },
  tasks: {
    id: 'mytasks.filter.tasks',
    defaultMessage: 'Tasks',
  },
  recentlyEdited: {
    id: 'mytasks.filter.recentlyEdited',
    defaultMessage: 'Recently edited',
  },
  projectId: {
    id: 'mytasks.filter.projectId',
    defaultMessage: 'Project ID',
  },
  sortBy: {
    id: 'mytasks.filter.sortBy',
    defaultMessage: 'Sort by',
  },
  clearFilters: {
    id: 'mytasks.filter.clear',
    defaultMessage: 'Clear filters',
  },
  errorLoadingTasks: {
    id: 'mytasks.navFilters.error',
    defaultMessage: 'Error while loading the tasks',
  },
  paginationCount: {
    id: 'mytasks.pagination.count',
    defaultMessage: 'Showing {number} of {total}',
  },
  lastUpdatedByUser: {
    id: 'mytasks.nav.lastUpdatedBy',
    defaultMessage: 'Last updated {time}',
  },
  viewAll: {
    id: 'mytasks.nav.viewAll',
    defaultMessage: 'View All',
  },
  delete: {
    id: 'mytasks.nav.delete.button',
    defaultMessage: 'Delete',
  },
  noContributed: {
    id: 'mytasks.nav.noContributedItems',
    defaultMessage: 'No Contributed Items',
  },
  resumeTask: {
    id: 'mytasks.nav.resumeMappingTask',
    defaultMessage: 'Resume task',
  },
  lockedByLockholder: {
    id: 'mytasks.nav.lockedByLockholder',
    defaultMessage: 'Locked by {lockholder}',
  },
  unlock: {
    id: 'mytasks.unlock',
    defaultMessage: 'unlock {time}',
  },
  projectTask: {
    id: 'mytasks.tasks.title',
    defaultMessage: 'Task #{task} · Project #{project}',
  },
  retry: {
    id: 'mytasks.tasks.button.retry',
    defaultMessage: 'Retry',
  },
  commentsNumber: {
    id: 'mytasks.tasks.comments.number',
    defaultMessage: '{number, plural, one {# comment} other {# comments}}',
  },
  assignedToMe: {
    id: 'mytasks.nav.assigned_to_me',
    defaultMessage: 'Assigned to me',
  },
  assignedTasks: {
    id: 'mytasks.assigned.title',
    defaultMessage: 'Tasks assigned to me',
  },
  allMyTasks: {
    id: 'mytasks.assigned.all_my_tasks',
    defaultMessage: 'All my tasks',
  },
  showCompletedAssignments: {
    id: 'mytasks.assigned.show_completed',
    defaultMessage: 'Show completed assignments',
  },
  noAssignedTasks: {
    id: 'mytasks.assigned.empty',
    defaultMessage: 'No tasks are assigned to you right now.',
  },
  assignedTasksError: {
    id: 'mytasks.assigned.error',
    defaultMessage: 'Your assigned tasks could not be loaded.',
  },
  assignedForStage: {
    id: 'mytasks.assigned.stage',
    defaultMessage: '{stage, select, VALIDATION {Validation} other {Mapping}}',
  },
  assignedViaTeam: {
    id: 'mytasks.assigned.via_team',
    defaultMessage: 'via team {team}',
  },
  assignedByUser: {
    id: 'mytasks.assigned.by_user',
    defaultMessage: 'Assigned by {user} {time}',
  },
});
