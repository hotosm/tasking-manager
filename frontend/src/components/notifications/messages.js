import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on homepage.
 */
export default defineMessages({
  notifications: {
    id: 'notifications.mainSection.title',
    defaultMessage: 'Notifications',
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
  projects: {
    id: 'notifications.filter.projects',
    defaultMessage: 'Projects',
  },
  clearFilters: {
    id: 'notifications.filter.clear',
    defaultMessage: 'Clear filters',
  },
  errorLoadingTheXForY: {
    id: 'notifications.navFilters.error',
    defaultMessage: 'Error loading the {xWord} for {yWord}',
  },
  errorLoadingTheX: {
    id: 'notifications.navFilters.error',
    defaultMessage: 'Error loading the {xWord}',
  },
  showingXProjectsOfTotal: {
    id: 'notifications.nav.showing',
    defaultMessage: 'Showing {numProjects} notifications{numRange} of {numTotalProjects}',
  },
  xNew: {
    id: 'notifications.nav.xNew',
    defaultMessage: '{xNew} New',
  },
  viewAll: {
    id: 'notifications.nav.viewAll',
    defaultMessage: 'View All',
  },
  noUnreadMessages: {
    id: 'notifications.nav.noUnread',
    defaultMessage: 'No unread messages',
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
    defaultMessage: 'New notifications last',
  },
  notificationsRetry: {
    id: 'notifications.error.tryagain',
    defaultMessage: 'Try Again',
  },
  notificationsRefresh: {
    id: 'notifications.refresh',
    defaultMessage: 'Refresh',
  },
});
