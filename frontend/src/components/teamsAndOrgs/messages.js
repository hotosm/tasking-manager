import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on teams and orgs.
 */
export default defineMessages({
  notAllowed: {
    id: 'management.messages.notAllowed',
    defaultMessage: 'You are not allowed to manage organizations.',
  },
  managers: {
    id: 'management.fields.managers',
    defaultMessage: 'Managers',
  },
  manage: {
    id: 'management.link.manage',
    defaultMessage: 'Manage {entity}',
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
  interests: {
    id: 'management.interests',
    defaultMessage: 'Interests',
  },
  users: {
    id: 'management.users',
    defaultMessage: 'users',
  },
  interest: {
    id: 'management.interest',
    defaultMessage: 'Interest',
  },
  interestInfo: {
    id: 'management.titles.interest_information',
    defaultMessage: 'Interest information',
  },
  editMembersLater: {
    id: 'management.edit_members',
    defaultMessage: 'You will be able to add more users after you save for the first time.',
  },
  myOrganisations: {
    id: 'management.myOrganisations',
    defaultMessage: 'My Organizations',
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
  name: {
    id: 'management.fields.name',
    defaultMessage: 'Name',
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
  searchManagers: {
    id: 'management.placeholder.search_managers',
    defaultMessage: 'Search for Project Manager users',
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
  noInterests: {
    id: 'management.no_interests',
    defaultMessage: 'There are no interests yet.',
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
    defaultMessage: "This organization doesn't have teams yet.",
  },
});
