import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on teams and orgs.
 */
export default defineMessages({
  notAllowed: {
    id: 'management.messages.notAllowed',
    defaultMessage: 'You are not allowed to manage organizations.',
  },
  notAllowedPartners: {
    id: 'management.messages.notAllowedPartners',
    defaultMessage: 'You are not allowed to manage partners.',
  },
  imageUploadFailed: {
    id: 'management.messages.imageUpload.error',
    defaultMessage: 'The image upload failed.',
  },
  managers: {
    id: 'management.fields.managers',
    defaultMessage: 'Managers',
  },
  remove: { id: 'management.fields.managers.remove', defaultMessage: 'Remove' },
  add: { id: 'management.fields.managers.add', defaultMessage: 'Add' },
  link: { id: 'management.fields.managers.link', defaultMessage: 'Link' },
  noManagers: {
    id: 'management.fields.managers.empty',
    defaultMessage: 'There are no managers yet.',
  },
  manage: {
    id: 'management.link.manage',
    defaultMessage: 'Manage {entity}',
  },
  editTeam: {
    id: 'management.link.edit.team',
    defaultMessage: 'Edit team',
  },
  edits: {
    id: 'management.partnersActivity.edits',
    defaultMessage: 'Edits',
  },
  buildings: {
    id: 'management.partnersActivity.buildings',
    defaultMessage: 'Buildings Added',
  },
  roads: {
    id: 'management.partnersActivity.roads',
    defaultMessage: 'km of Roads Added',
  },
  users: {
    id: 'management.partnersActivity.users',
    defaultMessage: 'Users',
  },
  readMore: {
    id: 'project.readMoreButton',
    defaultMessage: 'Read more',
  },
  startMapping: {
    id: 'management.partnersCurrentProjects.startMapping',
    defaultMessage: 'Start mapping',
  },
  learnToMap: {
    id: 'management.partner.learnToMap',
    defaultMessage: 'Learn to Map',
  },
  connectOnMSTeams: {
    id: 'management.partner.resources.connectOnMSTeams',
    defaultMessage: 'Connect on MS Teams',
  },
  hostAMapathonEvent: {
    id: 'management.partner.resources.hostAMapathonEvent',
    defaultMessage: 'Host a mapathon event',
  },
  supportEmail: {
    id: 'management.partner.resources.supportEmail',
    defaultMessage: 'Support Email',
  },
  logYourVolunteerHours: {
    id: 'management.partner.resources.logYourVolunteerHours',
    defaultMessage: 'Log your volunteer hours',
  },
  resourcesButton:{
    id: 'management.edit.resourcesButton',
    defaultMessage: 'Resources link',
  },
  edit: {
    id: 'management.members.edit',
    defaultMessage: 'Edit',
  },
  alreadyInTeam: {
    id: 'management.members.alreadyInTeam',
    defaultMessage: 'Already in team',
  },
  noOptions: {
    id: 'management.members.search.noOptions',
    defaultMessage: 'No options',
  },
  UserAlreadyInListError: {
    id: 'management.members.UserAlreadyInListError',
    defaultMessage: 'User is already a member of this team or has already requested to join.',
  },
  members: {
    id: 'management.members',
    defaultMessage: 'Members',
  },
  noMembers: {
    id: 'management.members.empty',
    defaultMessage: 'There are no members yet.',
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
  sendMessageSuccess: {
    id: 'management.teams.members.send_message.success',
    defaultMessage: 'Message sent',
  },
  sendMessageFailure: {
    id: 'management.teams.members.send_message.failure',
    defaultMessage: 'Failed to send message. Please try again.',
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
    defaultMessage: "There aren't any requests to join the team.",
  },
  teams: {
    id: 'management.teams',
    defaultMessage: 'Teams',
  },
  team: {
    id: 'management.team',
    defaultMessage: 'Team',
  },
  leaveTheTeam: {
    id: 'user.team.leaveTeam',
    defaultMessage: 'Leave the team',
  },
  leaveTheTeamDescription: {
    id: 'user.team.leaveTeam.description',
    defaultMessage: 'Are you sure you want to leave <b>{name}</b>?',
  },
  leave: {
    id: 'user.team.leaveTeam.button.leave',
    defaultMessage: 'Leave',
  },
  projects: {
    id: 'management.projects',
    defaultMessage: 'Projects',
  },
  stale: {
    id: 'management.projects.stale',
    defaultMessage: 'Stale',
  },
  createdThisYear: {
    id: 'management.projects.created_this_year',
    defaultMessage: 'Created this year',
  },
  projectsCreated: {
    id: 'management.projects.created.total',
    defaultMessage: '{number, plural, one {# project created} other {# projects created}}',
  },
  numberOfProjects: {
    id: 'management.projects.stats',
    defaultMessage: '{number, plural, one {# project} other {# projects}}',
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
  searchOrganisations: {
    id: 'management.filter.textarea.searchOrganisations',
    defaultMessage: 'Search organisations...',
  },
  myPartners: {
    id: 'management.filter.buttons.myPartners',
    defaultMessage: 'My Partners',
  },
  searchPartners: {
    id: 'management.filter.textarea.searchPartners',
    defaultMessage: 'Search partners...',
  },
  buildingsStats: {
    id: 'management.filter.stats.buildingsStats',
    defaultMessage: 'Building Edits',
  },
  contributors: {
    id: 'management.contributors',
    defaultMessage: 'Contributors',
  },
  roadsStats: {
    id: 'management.filter.stats.roadsStats',
    defaultMessage: 'km of Roads',
  },
  editsStats: {
    id: 'management.filter.stats.editsStats',
    defaultMessage: 'Total Edits',
  },
  communityStats: {
    id: 'management.filter.stats.communityStats',
    defaultMessage: 'Community stats',
  },
  mappersStats: {
    id: 'management.filter.stats.mappersStats',
    defaultMessage: 'Contributors',
  },
  searchTeams: {
    id: 'management.filter.textarea.searchTeams',
    defaultMessage: 'Search teams...',
  },
  searchCampaigns: {
    id: 'management.filter.textarea.searchCampaigns',
    defaultMessage: 'Search campaigns...',
  },
  searchCategories: {
    id: 'management.filter.textarea.searchCategories',
    defaultMessage: 'Search categories...',
  },
  searchLicenses: {
    id: 'management.filter.textarea.searchLicenses',
    defaultMessage: 'Search licenses...',
  },
  all: {
    id: 'management.filter.buttons.all',
    defaultMessage: 'All',
  },
  myTeams: {
    id: 'management.myTeams',
    defaultMessage: 'My teams',
  },
  errorLoadingTeams: {
    id: 'teams.loading.error',
    defaultMessage: 'An error occured while loading teams.',
  },
  new: {
    id: 'management.buttons.new',
    defaultMessage: 'New',
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
  partner: {
    id: 'management.partner',
    defaultMessage: 'Partner',
  },
  partners: {
    id: 'management.partners',
    defaultMessage: 'Partners',
  },
  type: {
    id: 'management.organisations.type',
    defaultMessage: 'Type',
  },
  publicUrl: {
    id: 'management.organisations.publicUrl',
    defaultMessage: 'Public URL',
  },
  copyPublicUrl: {
    id: 'management.organisations.publicUrl.copy',
    defaultMessage: 'Copy public URL',
  },
  selectTier: {
    id: 'management.organisations.tier.select',
    defaultMessage: 'Select tier',
  },
  selectType: {
    id: 'management.organisations.type.select',
    defaultMessage: 'Select type',
  },
  requiredField: {
    id: 'management.organisations.field.required',
    defaultMessage: 'Required field',
  },
  free: {
    id: 'management.organisations.type.free',
    defaultMessage: 'Free',
  },
  discounted: {
    id: 'management.organisations.type.discounted',
    defaultMessage: 'Discounted',
  },
  defaultFee: {
    id: 'management.organisations.type.defaultFee',
    defaultMessage: 'Default fee',
  },
  noOrganisationsFound: {
    id: 'management.organisations.list.empty',
    defaultMessage: 'No organizations were found.',
  },
  noPartnersFound: {
    id: 'management.partners.list.empty',
    defaultMessage: 'No partners were found.',
  },
  retry: {
    id: 'management.organisations.stats.retry',
    defaultMessage: 'Try again',
  },
  errorLoadingStats: {
    id: 'management.organisations.stats.error',
    defaultMessage: 'An error occurred while loading stats.',
  },
  badStartDate: {
    id: 'management.organisations.stats.error.start_date',
    defaultMessage: 'Start date should not be later than end date.',
  },
  longDateRange: {
    id: 'management.organisations.stats.error.date_range',
    defaultMessage: 'Date range is longer than one year.',
  },
  toBeMapped: {
    id: 'management.organisations.stats.to_be_mapped',
    defaultMessage: 'Tasks to be mapped',
  },
  tasksMapped: {
    id: 'management.organisations.stats.tasks_mapped',
    defaultMessage: 'Tasks mapped',
  },
  readyForValidation: {
    id: 'management.organisations.stats.ready_for_validation',
    defaultMessage: 'Ready for validation',
  },
  tasksValidated: {
    id: 'management.organisations.stats.tasks_validated',
    defaultMessage: 'Tasks validated',
  },
  actionsNeeded: {
    id: 'management.organisations.stats.actions_needed',
    defaultMessage: 'Actions needed',
  },
  completedActions: {
    id: 'management.organisations.stats.completed_actions',
    defaultMessage: 'Completed actions',
  },
  actionsNeededHelp: {
    id: 'management.organisations.stats.actions_needed.help',
    defaultMessage:
      'Action means a mapping or validation operation. As each task needs to be mapped and validated, this is the number of actions needed to finish all the published projects of that organization.',
  },
  subscribedTier: {
    id: 'management.organisations.stats.tier.subscribed',
    defaultMessage: 'Subscribed tier',
  },
  levelTooltip: {
    id: 'management.organisations.stats.level.tooltip',
    defaultMessage: '{n} of {total} ({percent}%) completed to move to level {nextLevel}',
  },
  tierTooltip: {
    id: 'management.organisations.stats.tier.tooltip',
    defaultMessage: '{n} of {total} ({percent}%) completed to move to the {nextTier} tier',
  },
  levelInfo: {
    id: 'management.organisations.stats.level.description',
    defaultMessage: '{org} is an organization level {level}.',
  },
  estimatedLevel: {
    id: 'management.organisations.stats.level.estimation',
    defaultMessage: 'Estimated level by the end of {year}',
  },
  estimatedTier: {
    id: 'management.organisations.stats.tier.estimation',
    defaultMessage: 'Estimated tier by the end of {year}',
  },
  estimatedCost: {
    id: 'management.organisations.stats.cost.estimation',
    defaultMessage: 'Estimated cost by the end of {year}',
  },
  actionsToNextLevel: {
    id: 'management.organisations.stats.next_level.actions',
    defaultMessage: 'Actions to reach the level {n}',
  },
  actionsRemaining: {
    id: 'management.organisations.stats.tier.actions_remaining',
    defaultMessage: 'Actions remaining on the {name} tier',
  },
  freeTier: {
    id: 'management.organisations.tier.free',
    defaultMessage: 'Free',
  },
  lowTier: {
    id: 'management.organisations.tier.low',
    defaultMessage: 'Low',
  },
  mediumTier: {
    id: 'management.organisations.tier.medium',
    defaultMessage: 'Medium',
  },
  highTier: {
    id: 'management.organisations.tier.high',
    defaultMessage: 'High',
  },
  veryHighTier: {
    id: 'management.organisations.tier.very_high',
    defaultMessage: 'Very High',
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
  partnersInfo: {
    id: 'management.titles.partner_information',
    defaultMessage: 'Partner information',
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
  joinMethod: {
    id: 'management.fields.join_method',
    defaultMessage: 'Join method',
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
  permalink:{
    id: 'management.titles.partner_permalink',
    defaultMessage: 'Permalink',
  },
  primaryhashtag: {
    id: 'management.titles.partner_primaryhashtag',
    defaultMessage: 'Primaryhashtag',
  },
  secondaryhashtag: {
    id: 'management.titles.partner_secondaryhashtag',
    defaultMessage: 'Secondaryhashtag',
  },
  logo: { id: 'management.titles.partner_logo', defaultMessage: 'Logo' },
  metaLink: { id: 'management.titles.partner_metaLink', defaultMessage: 'Meta Link' },
  xLink: { id: 'management.titles.partner_xLink', defaultMessage: 'X Link' },
  instagramLink: {
    id: 'management.titles.partner_instagramLink',
    defaultMessage: 'Instagram Link',
  },
  currentProjects: {
    id: 'management.titles.partner.currentProjects',
    defaultMessage: 'Current projects',
  },
  settings: {
    id: 'management.settings',
    defaultMessage: 'Settings',
  },
  searchUsers: {
    id: 'management.placeholder.search_users',
    defaultMessage: 'Search for Tasking Manager users',
  },
  searchMembers: {
    id: 'management.placeholder.search_members',
    defaultMessage: 'Search team members...',
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
    defaultMessage: 'No team found.',
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
  anyoneCanJoin: {
    id: 'management.teams.join_method.any',
    defaultMessage: 'Anyone can join',
  },
  anyoneCanJoinDescription: {
    id: 'management.teams.join_method.any.description',
    defaultMessage: 'This team is open to everyone.',
  },
  byRequest: {
    id: 'management.teams.join_method.byRequest',
    defaultMessage: 'By request',
  },
  byRequestDescription: {
    id: 'management.teams.join_method.by_request.description',
    defaultMessage:
      'To join this team, users must send a join request, which must be approved by team managers.',
  },
  byInvite: {
    id: 'management.teams.join_method.byInvite',
    defaultMessage: 'By invite',
  },
  byInviteDescription: {
    id: 'management.teams.join_method.by_invite.description',
    defaultMessage: 'Users can only join this team if managers invite them.',
  },
  public: {
    id: 'management.teams.visibility.public',
    defaultMessage: 'Public',
  },
  publicDescription: {
    id: 'management.teams.visibility.public.description',
    defaultMessage: 'This team will be displayed on the team members profiles.',
  },
  private: {
    id: 'management.teams.visibility.private',
    defaultMessage: 'Private',
  },
  privateDescription: {
    id: 'management.teams.visibility.private.description',
    defaultMessage: 'This team will not be displayed on the team members profiles.',
  },
  newJoinRequestNotification: {
    id: 'management.teams.newJoinRequestNotification',
    defaultMessage:
      'Enable for team managers to receive (email) notifications each time a new join request is made',
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
  newUsersOnLastMonth: {
    id: 'management.stats.new_users.month',
    defaultMessage:
      '{number, plural, one {# user registered in the last 30 days} other {# users registered in the last 30 days}}',
  },
  newUsersOnLastWeek: {
    id: 'management.stats.new_users.week',
    defaultMessage:
      '{number, plural, one {# user registered in the last 7 days} other {# users registered in the last 7 days}}',
  },
  activeNewUsers: {
    id: 'management.stats.new_users.active',
    defaultMessage: 'Mapped at least one task',
  },
  emailVerified: {
    id: 'management.stats.new_users.email_verified',
    defaultMessage: 'Confirmed email address',
  },
  statistics: {
    id: 'management.stats.title',
    defaultMessage: 'Statistics',
  },
  overview: {
    id: 'management.stats.overview',
    defaultMessage: 'Overview',
  },
  totalFeatures: {
    id: 'management.stats.features',
    defaultMessage: 'Total features',
  },
});
