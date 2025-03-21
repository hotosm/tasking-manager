import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on project cards.
 */
export default defineMessages({
  projectTitle: {
    id: 'project.mainSection.title',
    defaultMessage: 'Generic project',
  },
  mappingDifficulty: {
    id: 'project.nav.mappingDifficulty',
    defaultMessage: 'Difficulty level',
  },
  moreFilters: {
    id: 'project.nav.moreFilters',
    defaultMessage: 'More filters',
  },
  campaign: {
    id: 'project.nav.campaign',
    defaultMessage: 'Campaign',
  },
  startDate: {
    id: 'navFilters.startDate',
    defaultMessage: 'From',
  },
  startDatePlaceholder: {
    id: 'navFilters.startDate.placeholder',
    defaultMessage: 'Click to select a start date',
  },
  endDate: {
    id: 'navFilters.endDate',
    defaultMessage: 'To',
  },
  endDatePlaceholder: {
    id: 'navFilters.endDatePlace.placeholder',
    defaultMessage: 'Click to select an end date',
  },
  dateRange: {
    id: 'navFilters.dateRange',
    defaultMessage: 'Date Range',
  },
  thisWeek: {
    id: 'navFilters.thisWeek',
    defaultMessage: 'This week',
  },
  thisMonth: {
    id: 'navFilters.thisMonth',
    defaultMessage: 'This month',
  },
  thisYear: {
    id: 'navFilters.thisYear',
    defaultMessage: 'This year',
  },
  lastWeek: {
    id: 'navFilters.lastWeek',
    defaultMessage: 'Last week',
  },
  lastMonth: {
    id: 'navFilters.lastMonth',
    defaultMessage: 'Last month',
  },
  lastYear: {
    id: 'navFilters.lastYear',
    defaultMessage: 'Last year',
  },
  customRange: {
    id: 'navFilters.customRange',
    defaultMessage: 'Custom range',
  },
  showMapToggle: {
    id: 'project.nav.showMapToggle',
    defaultMessage: 'Show map',
  },
  listViewToggle: {
    id: 'project.nav.listViewToggle',
    defaultMessage: 'List view',
  },
  typesOfMapping: {
    id: 'project.navFilters.typesOfMapping',
    defaultMessage: 'Types of mapping',
  },
  projectsToMap: {
    id: 'project.navFilters.action.map',
    defaultMessage: 'Projects to map',
  },
  projectsToValidate: {
    id: 'project.navFilters.action.validate',
    defaultMessage: 'Projects to validate',
  },
  anyProject: {
    id: 'project.navFilters.action.any',
    defaultMessage: 'Any project',
  },
  exactMatch: {
    id: 'project.navFilters.typesOfMapping.exactMatch',
    defaultMessage: 'Exact match',
  },
  campaigns: {
    id: 'project.navFilters.campaigns',
    defaultMessage: 'All campaigns',
  },
  showAllXTags: {
    id: 'project.navFilters.showAllXTags',
    defaultMessage: 'Show {typeOfTag}',
  },
  searchPlaceholder: {
    id: 'project.inputs.placeholders.search',
    defaultMessage: 'Search project',
  },
  organisation: {
    id: 'project.navFilters.organisation',
    defaultMessage: 'Organization',
  },
  organisations: {
    id: 'project.navFilters.organisations',
    defaultMessage: 'All Organizations',
  },
  location: {
    id: 'project.navFilters.location',
    defaultMessage: 'Location',
  },
  locations: {
    id: 'project.navFilters.locations',
    defaultMessage: 'Locations',
  },
  interest: {
    id: 'project.navFilters.interest',
    defaultMessage: 'Interest',
  },
  interests: {
    id: 'project.navFilters.interests',
    defaultMessage: 'Interests',
  },
  filterByMyInterests: {
    id: 'project.navFilters.filterByMyInterests',
    defaultMessage: 'Filter by my interests',
  },
  errorLoadingTheXForY: {
    id: 'project.navFilters.error',
    defaultMessage: 'Error loading the {xWord} for {yWord}',
  },
  filters: {
    id: 'project.nav.filters',
    defaultMessage: 'Filters',
  },
  projects: {
    id: 'project.nav.projects',
    defaultMessage: 'Projects',
  },
  myProjects: {
    id: 'project.nav.myprojects',
    defaultMessage: 'My Projects',
  },
  manageProjects: {
    id: 'project.nav.manageProjects',
    defaultMessage: 'Manage Projects',
  },
  favorited: {
    id: 'project.nav.favorited',
    defaultMessage: 'Favorited',
  },
  contributed: {
    id: 'project.nav.contributed',
    defaultMessage: 'Contributed',
  },
  allprojects: {
    id: 'project.nav.allprojects',
    defaultMessage: 'All',
  },
  active: {
    id: 'project.nav.active',
    defaultMessage: 'Active',
  },
  stale: {
    id: 'project.nav.stale',
    defaultMessage: 'Stale',
  },
  managed: {
    id: 'project.nav.managed',
    defaultMessage: 'Managed by me',
  },
  created: {
    id: 'project.nav.created',
    defaultMessage: 'Created by me',
  },
  draft: {
    id: 'project.nav.draft',
    defaultMessage: 'Draft',
  },
  archived: {
    id: 'project.nav.archived',
    defaultMessage: 'Archived',
  },
  paginationCount: {
    id: 'project.pagination.count',
    defaultMessage: 'Showing {number} of {total} projects',
  },
  clearFilters: {
    id: 'project.nav.clearFilters',
    defaultMessage: 'Clear filters',
  },
  sortBy: {
    id: 'project.sortby',
    defaultMessage: 'Sort by',
  },
  sortByIdDesc: {
    id: 'project.sortby.id.descending',
    defaultMessage: 'New projects',
  },
  sortByIdAsc: {
    id: 'project.sortby.id.ascending',
    defaultMessage: 'Old projects',
  },
  sortByPriority: {
    id: 'project.sortby.priority',
    defaultMessage: 'Urgent projects',
  },
  sortByEasy: {
    id: 'project.sortby.difficulty.easy',
    defaultMessage: 'Easy projects',
  },
  sortByChallenging: {
    id: 'project.sortby.difficulty.challenging',
    defaultMessage: 'Challenging projects',
  },
  sortByMoreActive: {
    id: 'project.sortby.more_active',
    defaultMessage: 'Active projects',
  },
  sortByDueDateAsc: {
    id: 'project.sortby.due_date',
    defaultMessage: 'Due Soon',
  },
  sortByPercentMappedDesc: {
    id: 'project.sortby.percent_mapped',
    defaultMessage: 'Most Mapped',
  },
  sortByPercentValidatedDesc: {
    id: 'project.sortby.percent_validated',
    defaultMessage: 'Most Validated',
  },
  apply: {
    id: 'project.nav.apply',
    defaultMessage: 'Apply',
  },
  clear: {
    id: 'project.nav.clear',
    defaultMessage: 'Clear',
  },
  retry: {
    id: 'project.results.retry',
    defaultMessage: 'Retry',
  },
  partner: {
    id: 'project.navFilters.partner',
    defaultMessage: 'Partner',
  },
  partnerDates: {
    id: 'project.navFilters.partnerDates',
    defaultMessage: 'Partner Dates',
  },
  partnerFromDate: {
    id: 'project.navFilters.partnerFromDate',
    defaultMessage: 'Date From',
  },
  partnerEndDate: {
    id: 'project.navFilters.partnerEndDate',
    defaultMessage: 'Date To',
  },
  nameColumn: {
    id: 'project.table.name.column',
    defaultMessage: 'Name',
  },
  authorColumn: {
    id: 'project.table.author.column',
    defaultMessage: 'Author',
  },
  organisationColumn: {
    id: 'project.table.organisation.column',
    defaultMessage: 'Organisation',
  },
  progressColumn: {
    id: 'project.table.progress.column',
    defaultMessage: 'Progress',
  },
  contributorsColumn: {
    id: 'project.table.contributors.column',
    defaultMessage: 'Contributors',
  },
  priorityColumn: {
    id: 'project.table.priority.column',
    defaultMessage: 'Priority',
  },
  difficultyColumn: {
    id: 'project.table.difficulty.column',
    defaultMessage: 'Difficulty',
  },
  statusColumn: {
    id: 'project.table.status.column',
    defaultMessage: 'Status',
  },
  locationColumn: {
    id: 'project.table.location.column',
    defaultMessage: 'Location',
  },
  lastUpdatedColumn: {
    id: 'project.table.lastUpdated.column',
    defaultMessage: 'Last updated',
  },
  dueDateColumn: {
    id: 'project.table.dueDate.column',
    defaultMessage: 'Due date',
  },
  percentMapped: {
    id: 'project.table.percentMapped',
    defaultMessage: '{n}% mapped',
  },
  percentValidated: {
    id: 'project.table.percentValidated',
    defaultMessage: '{n}% validated',
  },
  downloadAsCSV: {
    id: 'project.table.downloadAsCSV',
    defaultMessage: 'Download CSV',
  },
  downloadAsCSVError: {
    id: 'project.table.downloadAsCSV.error',
    defaultMessage: 'Something went wrong. Could not download CSV.',
  },
  projectsTableEmpty: {
    id: 'project.table.empty',
    defaultMessage: 'No projects were found. Try updating the search term or filters if any.',
  },
});
