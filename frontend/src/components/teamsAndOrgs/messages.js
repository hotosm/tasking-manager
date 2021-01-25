import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on teams and orgs.
 */
export default defineMessages({
  notAllowed: {
    id: 'management.messages.notAllowed',
    defaultMessage: 'You are not allowed to manage organizations.',
  },
  imageUploadFailed: {
    id: 'management.messages.imageUpload.error',
    defaultMessage: 'The image upload failed.',
  },
  managers: {
    id: 'management.fields.managers',
    defaultMessage: 'Managers',
  },
  manage: {
    id: 'management.link.manage',
    defaultMessage: 'Manage {entity}',
  },
  editTeam: {
    id: 'management.link.edit.team',
    defaultMessage: 'Edit team',
  },
  members: {
    id: 'management.members',
    defaultMessage: 'Members',
  },
  mappingTeams: {
    id: 'management.teams.mapping',
    defaultMessage: 'Mapping teams',
  },
  validationTeams: {
    id: 'management.teams.validation',
    defaultMessage: 'Validation teams',
  },
  teamMembers: {
    id: 'management.teams.members',
    defaultMessage: 'Team members',
  },
  messageMembers: {
    id: 'management.teams.members.send_message',
    defaultMessage: 'Team messaging',
  },
  send: {
    id: 'management.teams.members.send_message.button',
    defaultMessage: 'Send',
  },
  subjectPlaceholder: {
    id: 'management.teams.members.send_message.subject',
    defaultMessage: 'Subject',
  },
  joinRequests: {
    id: 'management.teams.join_requests',
    defaultMessage: 'Join requests',
  },
  noRequests: {
    id: 'management.teams.join_requests.empty',
    defaultMessage: "There isn't requests to join the team.",
  },
  teams: {
    id: 'management.teams',
    defaultMessage: 'Teams',
  },
  team: {
    id: 'management.team',
    defaultMessage: 'Team',
  },
  projects: {
    id: 'management.projects',
    defaultMessage: 'Projects',
  },
  campaigns: {
    id: 'management.campaigns',
    defaultMessage: 'Campaigns',
  },
  campaign: {
    id: 'management.campaign',
    defaultMessage: 'Campaign',
  },
  categories: {
    id: 'management.categories',
    defaultMessage: 'Categories',
  },
  licenses: {
    id: 'management.licenses',
    defaultMessage: 'Licenses',
  },
  users: {
    id: 'management.users',
    defaultMessage: 'Users',
  },
  user: {
    id: 'management.user',
    defaultMessage: 'User',
  },
  category: {
    id: 'management.category',
    defaultMessage: 'Category',
  },
  categoryInfo: {
    id: 'management.titles.category_information',
    defaultMessage: 'Category information',
  },
  editMembersLater: {
    id: 'management.edit_members',
    defaultMessage: 'You will be able to add more users after you save for the first time.',
  },
  myOrganisations: {
    id: 'management.filter.buttons.myOrganisations',
    defaultMessage: 'My Organizations',
  },
  all: {
    id: 'management.filter.buttons.all',
    defaultMessage: 'All',
  },
  myTeams: {
    id: 'management.myTeams',
    defaultMessage: 'My teams',
  },
  add: {
    id: 'management.buttons.add',
    defaultMessage: 'Add',
  },
  delete: {
    id: 'management.buttons.delete',
    defaultMessage: 'Delete',
  },
  accept: {
    id: 'management.buttons.accept',
    defaultMessage: 'Accept',
  },
  reject: {
    id: 'management.buttons.reject',
    defaultMessage: 'Reject',
  },
  viewAll: {
    id: 'management.links.viewAll',
    defaultMessage: 'View all',
  },
  organisation: {
    id: 'management.organisation',
    defaultMessage: 'Organization',
  },
  organisations: {
    id: 'management.organisations',
    defaultMessage: 'Organizations',
  },
  toBeMapped: {
    id: 'management.organisations.stats.to_be_mapped',
    defaultMessage: 'Tasks to be mapped',
  },
  readyForValidation: {
    id: 'management.organisations.stats.ready_for_validation',
    defaultMessage: 'Ready for validation',
  },
  actionsNeeded: {
    id: 'management.organisations.stats.actions_needed',
    defaultMessage: 'Actions needed',
  },
  actionsNeededHelp: {
    id: 'management.organisations.stats.actions_needed.help',
    defaultMessage:
      'Action means a mapping or validation operation. As each task needs to be mapped and validated, this is the number of actions needed to finish all the published projects of that organization.',
  },
  levelTooltip: {
    id: 'management.organisations.stats.level.tooltip',
    defaultMessage: '{n} of {total} ({percent}%) completed to move to level {nextLevel}',
  },
  levelInfo: {
    id: 'management.organisations.stats.level.description',
    defaultMessage: '{org} is an organization level {level}.',
  },
  nextLevelInfo: {
    id: 'management.organisations.stats.level.next',
    defaultMessage: 'After completing more {n} actions, it will reach the level {nextLevel}.',
  },
  topLevelInfo: {
    id: 'management.organisations.stats.level.top',
    defaultMessage: 'It is the highest level an organization can be on Tasking Manager!',
  },
  orgInfo: {
    id: 'management.titles.organisation_information',
    defaultMessage: 'Organization information',
  },
  teamInfo: {
    id: 'management.titles.team_information',
    defaultMessage: 'Team information',
  },
  campaignInfo: {
    id: 'management.titles.campaign_information',
    defaultMessage: 'Campaign information',
  },
  licenseInfo: {
    id: 'management.titles.license_information',
    defaultMessage: 'License information',
  },
  name: {
    id: 'management.fields.name',
    defaultMessage: 'Name',
  },
  plainText: {
    id: 'management.fields.plain_text',
    defaultMessage: 'Plain Text',
  },
  description: {
    id: 'management.fields.description',
    defaultMessage: 'Description',
  },
  inviteOnly: {
    id: 'management.fields.invite_only',
    defaultMessage: 'Invite only',
  },
  visibility: {
    id: 'management.fields.visibility',
    defaultMessage: 'Visibility',
  },
  image: {
    id: 'management.fields.organisation.image',
    defaultMessage: 'Image',
  },
  website: {
    id: 'management.fields.website',
    defaultMessage: 'Website',
  },
  settings: {
    id: 'management.settings',
    defaultMessage: 'Settings',
  },
  searchUsers: {
    id: 'management.placeholder.search_users',
    defaultMessage: 'Search for Tasking Manager users',
  },
  save: {
    id: 'management.button.save',
    defaultMessage: 'Save',
  },
  done: {
    id: 'management.button.done',
    defaultMessage: 'Done',
  },
  cancel: {
    id: 'management.button.cancel',
    defaultMessage: 'Cancel',
  },
  administrators: {
    id: 'management.teams.administrators',
    defaultMessage: 'Administrators',
  },
  noTeams: {
    id: 'management.teams.no_teams',
    defaultMessage: 'You are not a member of a team yet.',
  },
  noCampaigns: {
    id: 'management.teams.no_campaigns',
    defaultMessage: 'There are no campaigns yet.',
  },
  noCategories: {
    id: 'management.no_categories',
    defaultMessage: 'There are no categories yet.',
  },
  noLicenses: {
    id: 'management.no_licenses',
    defaultMessage: 'There are no licenses yet.',
  },
  public: {
    id: 'management.teams.visibility.public',
    defaultMessage: 'Public',
  },
  private: {
    id: 'management.teams.visibility.private',
    defaultMessage: 'Private',
  },
  inviteOnlyDescription: {
    id: 'management.teams.invite_only.description',
    defaultMessage: "Managers need to approve a member's request to join.",
  },
  waitingApproval: {
    id: 'teamsAndOrgs.management.teams.messages.waiting_approval',
    defaultMessage: 'Your request to join this team is waiting for approval.',
  },
  noProjectsFound: {
    id: 'management.projects.no_found',
    defaultMessage: "This {entity} doesn't have projects yet.",
  },
  noTeamsFound: {
    id: 'management.organisation.teams.no_found',
    defaultMessage: 'No teams found.',
  },
});
