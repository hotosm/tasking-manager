import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on user components.
 */
export default defineMessages({
  loading: {
    id: 'users.detail.loading',
    defaultMessage: 'loading',
  },
  contributionTimelineTitle: {
    id: 'users.detail.contributionTimelineTitle',
    defaultMessage: 'Contribution Timeline',
  },
  projectsTitle: {
    id: 'users.detail.projectsTitle',
    defaultMessage: 'Projects',
  },
  countries: {
    id: 'users.detail.countries',
    defaultMessage: 'Countries',
  },
  timeSpentMapping: {
    id: 'users.detail.timeSpentMapping',
    defaultMessage: 'Time spent mapping',
  },
  buildingsMapped: {
    id: 'users.detail.buildingsMapped',
    defaultMessage: 'Buildings mapped',
  },
  roadMapped: {
    id: 'users.detail.roadMapped',
    defaultMessage: 'Km road mapped',
  },
  poiMapped: {
    id: 'users.detail.poiMapped',
    defaultMessage: 'Points of interests mapped',
  },
  waterwaysMapped: {
    id: 'users.detail.waterwaysMapped',
    defaultMessage: 'Km waterways mapped',
  },
  userMapped: {
    id: 'users.detail.tasksMapped',
    defaultMessage: '{user} mapped',
  },
  you: {
    id: 'users.detail.you',
    defaultMessage: 'You',
  },
  userValidated: {
    id: 'users.detail.tasksValidated',
    defaultMessage: '{user} validated',
  },
  invalidated: {
    id: 'users.detail.invalidated',
    defaultMessage: 'Needed more mapping',
  },
  validated: {
    id: 'users.detail.validated',
    defaultMessage: 'Validated',
  },
  finished: {
    id: 'users.detail.finished',
    defaultMessage: 'Finished',
  },
  topProjectsMappedTitle: {
    id: 'users.detail.topProjectsMappedTitle',
    defaultMessage: 'Top 5 projects contributed',
  },
  noTopProjectsData: {
    id: 'users.detail.topProjectsMapped.error',
    defaultMessage: 'No projects mapped until now.',
  },
  topCausesTitle: {
    id: 'users.detail.topCausesTitle',
    defaultMessage: 'Top causes contributed to',
  },
  others: {
    id: 'users.detail.others',
    defaultMessage: 'Others',
  },
  noProjectsData: {
    id: 'users.detail.projects.noData',
    defaultMessage: 'Information is not available because no projects were mapped until now.',
  },
  editsTitle: {
    id: 'users.detail.editsTitle',
    defaultMessage: 'Edits by numbers',
  },
  noEditsData: {
    id: 'users.detail.edits.error',
    defaultMessage:
      'No data to show yet. OpenStreetMap edits stats are updated with a delay of one hour.',
  },
  topCountriesTitle: {
    id: 'users.detail.topCountriesTitle',
    defaultMessage: 'Top 5 countries most mapped',
  },
  tasks: {
    id: 'users.detail.tasks',
    defaultMessage: 'tasks',
  },
  heatmapNoContribution: {
    id: 'users.detail.heatmapNoContribution',
    defaultMessage: 'No contribution',
  },
  heatmapContribution: {
    id: 'users.detail.heatmapContribution',
    defaultMessage: 'contribution',
  },
  heatmapContributions: {
    id: 'users.detail.heatmapContributions',
    defaultMessage: 'contributions',
  },
  heatmapLegendMore: {
    id: 'users.detail.heatmapLegendMore',
    defaultMessage: 'more',
  },
  heatmapLegendLess: {
    id: 'users.detail.heatmapLegendLess',
    defaultMessage: 'less',
  },
  teams: {
    id: 'users.detail.teams',
    defaultMessage: 'Teams',
  },
  userOrganisationsError: {
    id: 'users.header.organisations.error',
    defaultMessage: "Couldn't load organisations at this time",
  },
});
