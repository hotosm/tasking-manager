import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on homepage.
 */
export default defineMessages({
  notifications: {
    id: 'notifications.mainSection.title',
    defaultMessage: 'Notifications',
  },
  notification: {
    id: 'notifications.singular.notification',
    defaultMessage: 'notification',
  },
  all: {
    id: 'notifications.filter.all',
    defaultMessage: 'All',
  },
  messages: {
    id: 'notifications.filter.messages',
    defaultMessage: 'Messages',
  },
  message: {
    id: 'notifications.bodytitle.message',
    defaultMessage: 'Message',
  },
  tasks: {
    id: 'notifications.filter.tasks',
    defaultMessage: 'Tasks',
  },
  teams: {
    id: 'notifications.filter.teams',
    defaultMessage: 'Teams',
  },
  projects: {
    id: 'notifications.filter.projects',
    defaultMessage: 'Projects',
  },
  clearFilters: {
    id: 'notifications.filter.clear',
    defaultMessage: 'Clear filters',
  },
  markAsRead: {
    id: 'notifications.markAsRead',
    defaultMessage: 'Mark as read',
  },
  selectAll: {
    id: 'notifications.selectAll',
    defaultMessage:
      'Select all {count} notifications {activeTab, select, all {} other {in {activeTab}}}',
  },
  allNotificationsSelected: {
    id: 'notifications.allNotificationsSelected',
    defaultMessage:
      'All {count} notifications {activeTab, select, all {} other {in {activeTab}}} are selected. ',
  },
  allPageNotificationsSelected: {
    id: 'notifications.allPageNotificationsSelected',
    defaultMessage: 'All notifications on this page are selected.',
  },
  clearSelection: {
    id: 'notifications.clearSelection',
    defaultMessage: 'Clear selection',
  },
  errorLoadingNotifications: {
    id: 'notifications.errorLoadingNotifications',
    defaultMessage: 'There was an error while loading your notifications',
  },
  errorLoadingTheXForY: {
    id: 'notifications.navFilters.error',
    defaultMessage: 'Error loading the {xWord} for {yWord}',
  },
  errorLoadingTheX: {
    id: 'notifications.navFilters.error.simple',
    defaultMessage: 'Error loading the {xWord}',
  },
  paginationCount: {
    id: 'notifications.pagination.count',
    defaultMessage: 'Showing {number} of {total}',
  },
  oneNewNotification: {
    id: 'notifications.nav.new.one',
    defaultMessage: '1 unread notification',
  },
  unreadNotifications: {
    id: 'notifications.nav.unread.plural',
    defaultMessage: '{n} unread',
  },
  viewAll: {
    id: 'notifications.nav.viewAll',
    defaultMessage: 'View all',
  },
  goToNotifications: {
    id: 'notifications.nav.goToNotifications',
    defaultMessage: 'Go to notifications',
  },
  noUnreadMessages: {
    id: 'notifications.nav.noUnread',
    defaultMessage: 'No unread messages',
  },
  noMessages: {
    id: 'notifications.nav.noMessages',
    defaultMessage: "You don't have any messages.",
  },
  sortBy: {
    id: 'notifications.sortby',
    defaultMessage: 'Sort by',
  },
  sortByIdDesc: {
    id: 'notifications.sortby.id.descending',
    defaultMessage: 'New projects first',
  },
  sortByIdAsc: {
    id: 'notifications.sortby.id.ascending',
    defaultMessage: 'Old projects first',
  },
  sortByRead: {
    id: 'notifications.sortby.read.desc',
    defaultMessage: 'Read notifications first',
  },
  sortByDateDesc: {
    id: 'notifications.sortby.date.desc',
    defaultMessage: 'New notifications first',
  },
  sortByDateAsc: {
    id: 'notifications.sortby.date.asc',
    defaultMessage: 'Old notifications first',
  },
  notificationsRetry: {
    id: 'notifications.error.tryagain',
    defaultMessage: 'Try Again',
  },
  notificationsRefresh: {
    id: 'notifications.refresh',
    defaultMessage: 'Refresh',
  },
  SYSTEM: {
    id: 'notifications.message.type.system',
    defaultMessage: 'System',
  },
  BROADCAST: {
    id: 'notifications.message.type.broadcast',
    defaultMessage: 'Broadcast',
  },
  TEAM_BROADCAST: {
    id: 'notifications.message.type.team',
    defaultMessage: 'Team announcement',
  },
  MENTION_NOTIFICATION: {
    id: 'notifications.message.type.mention_notification',
    defaultMessage: 'Mention',
  },
  VALIDATION_NOTIFICATION: {
    id: 'notifications.message.type.validation_notification',
    defaultMessage: 'Validation',
  },
  INVALIDATION_NOTIFICATION: {
    id: 'notifications.message.type.invalidation_notification',
    defaultMessage: 'Invalidation',
  },
  REQUEST_TEAM_NOTIFICATION: {
    id: 'notifications.message.type.request_team_notification',
    defaultMessage: 'Request team',
  },
  INVITATION_NOTIFICATION: {
    id: 'notifications.message.type.invitation_notification',
    defaultMessage: 'Invitation',
  },
  TASK_COMMENT_NOTIFICATION: {
    id: 'notifications.message.type.task_comment_notification',
    defaultMessage: 'Task comment',
  },
  PROJECT_CHAT_NOTIFICATION: {
    id: 'notifications.message.type.project_chat_notification',
    defaultMessage: 'Project chat',
  },
  PROJECT_ACTIVITY_NOTIFICATION: {
    id: 'notifications.message.type.project_activity_notification',
    defaultMessage: 'Project activity',
  },
});
