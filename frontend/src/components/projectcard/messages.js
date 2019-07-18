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
    defaultMessage: ' total contributors'
  },
  percentMapped: {
    id: 'project.card.percentMapped',
    defaultMessage: '% Mapped'
  },
  percentValidated: {
    id: 'project.card.percentValidated',
    defaultMessage: '% Validated' 
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
  projectPriorityMEDIUM: {
    id: 'project.card.projectPriorityMedium',
    defaultMessage: 'Medium' 
  }, 
  projectPriorityLOW: {
    id: 'project.card.projectPriorityLow',
    defaultMessage: 'Low' 
  }
});
