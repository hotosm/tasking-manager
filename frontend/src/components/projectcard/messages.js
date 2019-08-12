import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on project cards.
 */
export default defineMessages({
  projectTitle: {
    id: 'project.mainSection.title',
    defaultMessage: 'Generic project'
  },
  projectTotalContributors: {
    id: 'project.card.contributorCount',
    defaultMessage: '{number} total contributors'
  },
  projectLastContribution: {
    id: 'project.card.lastContribution',
    defaultMessage: 'Last contribution'
  },
  percentMapped: {
    id: 'project.card.percentMapped',
    defaultMessage: ' Mapped'
  },
  percentValidated: {
    id: 'project.card.percentValidated',
    defaultMessage: ' Validated'
  },
  mappingDifficulty: {
    id: 'project.nav.mappingDifficulty',
    defaultMessage: 'Mapping difficulty'
  },
  projectMapperLevelBEGINNER: {
    id: 'project.card.mapperLevelBeginner',
    defaultMessage: 'Beginner'
  },
  projectMapperLevelINTERMEDIATE: {
    id: 'project.card.mapperLevelIntermediate',
    defaultMessage: 'Intermediate'
  },
  projectMapperLevelADVANCED: {
    id: 'project.card.mapperLevelAdvanced',
    defaultMessage: 'Advanced'
  },
  projectPriorityURGENT: {
    id: 'project.card.projectPriorityUrgent',
    defaultMessage: 'Urgent'
  },
  projectPriorityHIGH: {
    id: 'project.card.projectPriorityHigh',
    defaultMessage: 'High'
  },
  projectPriorityMEDIUM: {
    id: 'project.card.projectPriorityMedium',
    defaultMessage: 'Medium'
  },
  projectPriorityLOW: {
    id: 'project.card.projectPriorityLow',
    defaultMessage: 'Low'
  },
  dueDateRelativeRemainingDays: {
    id: 'project.card.dueDateLeft',
    defaultMessage: '{daysLeftHumanize} left'
  },
  moreFilters: {
    id: 'project.nav.moreFilters',
    defaultMessage: 'More Filters'
  },
  campaign: {
    id: 'project.nav.campaign',
    defaultMessage: 'Campaign'
  },
  showMapToggle: {
    id: 'project.nav.showMapToggle',
    defaultMessage: 'Show map'
  },
  typesOfMapping: {
    id: 'project.navMoreFilters.typesOfMapping',
    defaultMessage: "Types of Mapping"
  },
  campaigns: {
    id: 'project.navMoreFilters.campaigns',
    defaultMessage: 'Campaigns'
  },
  showAllXTags: {
    id: 'project.navMoreFilters.showAllXTags',
    defaultMessage: 'Show All {typeOfTag}'
  },
  organisation: {
    id: 'project.navMoreFilters.organisation',
    defaultMessage: 'Organisation'
  },
  organisations: {
    id: 'project.navMoreFilters.organisations',
    defaultMessage: 'Organisations'
  },
  location: {
    id: 'project.navMoreFilters.location',
    defaultMessage: 'Location'
  },
  locations: {
    id: 'project.navMoreFilters.locations',
    defaultMessage: 'Locations'
  },
  ErrorLoadingTheXForY: {
    id: 'project.navMoreFilters.error',
    defaultMessage: 'Error loading the {xWord} for {yWord}'
  },
  Filters: {
    id: 'project.nav.filters',
    defaultMessage: 'Filters'
  },
});
