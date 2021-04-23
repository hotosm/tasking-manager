import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on views.
 */
export default defineMessages({
  errorFallback: {
    id: 'error.page.title',
    defaultMessage: 'An error occurred',
  },
  errorFallbackMessage: {
    id: 'error.page.description',
    defaultMessage: 'Something did not work well...',
  },
  return: {
    id: 'error.page.link',
    defaultMessage: 'Return',
  },
  pageNotFound: {
    id: 'notFound.page.title',
    defaultMessage: 'Page not found',
  },
  projectNotFound: {
    id: 'notFound.project.title',
    defaultMessage: 'Project {id} not found',
  },
  notFoundLead: {
    id: 'notFound.lead',
    defaultMessage: 'Check the URL or report this error.',
  },
  projectTimeline: {
    id: 'project.stats.timeline',
    defaultMessage: 'Project timeline',
  },
  sectionNotAllowed: {
    id: 'management.forbiddenAccess.title',
    defaultMessage: 'You are not allowed to access the management area.',
  },
  projectEditNotAllowed: {
    id: 'teamsAndOrgs.management.project.forbidden',
    defaultMessage: 'You are not allowed to edit this project.',
  },
  teamEditNotAllowed: {
    id: 'teamsAndOrgs.management.team.forbidden',
    defaultMessage: 'You are not allowed to edit this team.',
  },
  loginRequired: {
    id: 'loginPage.title',
    defaultMessage: 'Sign in to {org} Tasking Manager',
  },
  loginWithOSM: {
    id: 'loginPage.text.login',
    defaultMessage: 'You can log in with an OpenStreetMap account.',
  },
  createAccount: {
    id: 'loginPage.text.create_account',
    defaultMessage: 'Or create a new one to start mapping.',
  },
  managers: {
    id: 'management.managers',
    defaultMessage: 'Managers',
  },
  manageUsers: {
    id: 'management.users.title',
    defaultMessage: 'Manage users',
  },
  newUsers: {
    id: 'management.stats.users.title',
    defaultMessage: 'New users',
  },
  totalFeatures: {
    id: 'management.stats.features',
    defaultMessage: 'Total features',
  },
  newOrganisation: {
    id: 'teamsAndOrgs.management.organisation.creation',
    defaultMessage: 'Create new organization',
  },
  editOrganisation: {
    id: 'teamsAndOrgs.management.organisation.edit',
    defaultMessage: 'Edit organization',
  },
  newTeam: {
    id: 'teamsAndOrgs.management.team.creation',
    defaultMessage: 'Create new team',
  },
  newCampaign: {
    id: 'teamsAndOrgs.management.campaign.creation',
    defaultMessage: 'Create new campaign',
  },
  createOrganisation: {
    id: 'teamsAndOrgs.management.organisation.button.create',
    defaultMessage: 'Create organization',
  },
  createTeam: {
    id: 'teamsAndOrgs.management.team.button.create',
    defaultMessage: 'Create team',
  },
  createCampaign: {
    id: 'teamsAndOrgs.management.campaign.button.create',
    defaultMessage: 'Create campaign',
  },
  myTeams: {
    id: 'teamsAndOrgs.management.button.my_teams',
    defaultMessage: 'My teams',
  },
  joinTeam: {
    id: 'teamsAndOrgs.management.button.join_team',
    defaultMessage: 'Join team',
  },
  cancelRequest: {
    id: 'teamsAndOrgs.management.button.cancel_request',
    defaultMessage: 'Cancel request',
  },
  leaveTeam: {
    id: 'teamsAndOrgs.management.button.leave_team',
    defaultMessage: 'Leave team',
  },
  cancel: {
    id: 'teamsAndOrgs.management.button.cancel',
    defaultMessage: 'Cancel',
  },
  editOrgNotAllowed: {
    id: 'teamsAndOrgs.management.organisation.manage.error',
    defaultMessage:
      'You are not a manager of this organization, so you are not allowed to edit it.',
  },
  tasksStatistics: {
    id: 'teamsAndOrgs.management.organisation.stats',
    defaultMessage: 'Tasks statistics',
  },
  statistics: {
    id: 'teamsAndOrgs.management.organisation.activity.stats',
    defaultMessage: 'Statistics',
  },
  remainingTasks: {
    id: 'teamsAndOrgs.management.organisation.remaining_tasks',
    defaultMessage: 'Total remaining',
  },
  tier: {
    id: 'teamsAndOrgs.management.organisation.usage_tier',
    defaultMessage: 'Tier',
  },
  usageLevel: {
    id: 'teamsAndOrgs.management.organisation.usage_level',
    defaultMessage: 'Level',
  },
  manageOrganisation: {
    id: 'teamsAndOrgs.management.organisation.manage',
    defaultMessage: 'Manage organization',
  },
  manageTeam: {
    id: 'teamsAndOrgs.management.team.manage',
    defaultMessage: 'Manage team',
  },
  manageCampaign: {
    id: 'teamsAndOrgs.management.campaign.manage',
    defaultMessage: 'Manage campaign',
  },
  teamInfo: {
    id: 'teamsAndOrgs.management.titles.team_information',
    defaultMessage: 'Team information',
  },
  campaignInfo: {
    id: 'teamsAndOrgs.management.titles.campaign_information',
    defaultMessage: 'Campaign information',
  },
  manageLicense: {
    id: 'management.license.manage',
    defaultMessage: 'Manage license',
  },
  manageCategory: {
    id: 'management.category.manage',
    defaultMessage: 'Manage category',
  },
  categoryInfo: {
    id: 'management.interest.title',
    defaultMessage: 'Category information',
  },
  licenseInfo: {
    id: 'management.license.title',
    defaultMessage: 'License information',
  },
  newCategory: {
    id: 'management.category.creation',
    defaultMessage: 'Create new category',
  },
  newLicense: {
    id: 'management.license.creation',
    defaultMessage: 'Create new license',
  },
  createLicense: {
    id: 'management.license.button.create',
    defaultMessage: 'Create license',
  },
  createCategory: {
    id: 'management.category.button.create',
    defaultMessage: 'Create category',
  },
  noLockedTasksMessage: {
    id: 'taskAction.messages.error.no_locked_tasks.text',
    defaultMessage:
      "You don't have any locked tasks. Access the Project #{currentProject} to select a task to map.",
  },
  goToProjectButton: {
    id: 'taskAction.go_to_project.button',
    defaultMessage: 'Go to Project #{project}',
  },
  profileSettings: {
    id: 'EmailVerification.link.profileSettings',
    defaultMessage: 'Your profile settings',
  },
  emailVerified: {
    id: 'EmailVerification.status.verified',
    defaultMessage: 'Email confirmed successfully!',
  },
  verificationError: {
    id: 'EmailVerification.status.error',
    defaultMessage: 'Verification failed.',
  },
  verificationErrorExplanation: {
    id: 'EmailVerification.status.error.explanation',
    defaultMessage:
      'The verification of your email failed. Check if the URL on the browser matches with the URL sent to your email.',
  },
  emailVerifiedExplanation: {
    id: 'EmailVerification.status.verified.explanation',
    defaultMessage: 'Thanks for providing your email address.',
  },
  successExtraLine: {
    id: 'EmailVerification.status.verified.explanation.extraLine',
    defaultMessage:
      'From now on, we will keep you updated on how you can make the difference by mapping on Tasking Manager. You can customize your notification preferences on {link}.',
  },
  about: {
    id: 'pages.about.title',
    defaultMessage: 'About',
  },
  aboutIntro: {
    id: 'pages.about.intro',
    defaultMessage:
      'Every day, a global community works tirelessly behind the scenes to make the more complete map of the world. The resulting work is Open Data and can be used by anyone. Universal access to geospatial information is heavily changing how people use maps and what they build with them.',
  },
  learn: {
    id: 'pages.learn.title',
    defaultMessage: 'Learn',
  },
  learnPages: {
    id: 'pages.learn.pages',
    defaultMessage: 'Learn pages',
  },
  learnMapTitle: {
    id: 'pages.learn.map.title',
    defaultMessage: 'Learn to map',
  },
  learnMapIntro: {
    id: 'pages.learn.map.intro',
    defaultMessage:
      'Mapping in OpenStreetMap is a team effort, continually growing due to a community of hundreds of thousands of dedicated global contributors. Everybody can participate in this open map of the world, and it needs responsible people, who are open to learn and show love for the details.',
  },
  learnMapDescription: {
    id: 'pages.learn.map.description',
    defaultMessage:
      'You can start your journey now. You do not have to ask permission before adding or modifying existing data. If you believe that you can improve something, then do it. But always remember, with great power comes great responsibility.',
  },
  learnVideosTitle: {
    id: 'pages.learn.videos.title',
    defaultMessage: 'Videos',
  },
  learnManualsTitle: {
    id: 'pages.learn.manuals.title',
    defaultMessage: 'Manuals',
  },
  learnQuickStartTutorialTitle: {
    id: 'pages.learn.tutorials.quick_start.title',
    defaultMessage: 'Quickstart guide',
  },
  learnQuickStartTutorialDescription: {
    id: 'pages.learn.tutorials.quick_start.description',
    defaultMessage: 'Step by step instructions to get you mapping as fast as possible.',
  },
  learnTMManualTutorialTitle: {
    id: 'pages.learn.tutorials.tm_manual.title',
    defaultMessage: 'Tasking Manager User Manual',
  },
  learnTMManualTutorialDescription: {
    id: 'pages.learn.tutorials.tm_manual.description',
    defaultMessage:
      'Learn how to find a project and task that interests you, how to lock a task to edit and select the suitable editing software.',
  },
  learnOSMStepByStepTutorialTitle: {
    id: 'pages.learn.tutorials.osm_step_by_step.title',
    defaultMessage: 'Learn OpenStreetMap Step by Step',
  },
  learnOSMStepByStepTutorialDescription: {
    id: 'pages.learn.tutorials.osm_step_by_step.description',
    defaultMessage: 'Beginner’s Guide to mapping on OpenStreetMap',
  },
  learnOSMTutorialTitle: {
    id: 'pages.learn.tutorials.learnosm.title',
    defaultMessage: 'Administration Guide',
  },
  learnOSMTutorialDescription: {
    id: 'pages.learn.tutorials.learnosm.description',
    defaultMessage: 'Manual on how to create and manage projects in the Tasking Manager',
  },
  learnMapStepSelectProjectTitle: {
    id: 'pages.learn.map.steps.project.title',
    defaultMessage: 'Select a project',
  },
  learnMapStepSelectProjectDescription: {
    id: 'pages.learn.map.steps.project.description',
    defaultMessage:
      'Search through our list of projects for one that meets your interests and fits your skill level.',
  },
  learnMapStepSelectTaskTitle: {
    id: 'pages.learn.map.steps.task.title',
    defaultMessage: 'Select a task',
  },
  learnMapStepSelectTaskDescription: {
    id: 'pages.learn.map.steps.task.description',
    defaultMessage:
      'Projects are divided into a set of tasks manageable in size and adapted to your skill level',
  },
  learnMapStepMapOSMTitle: {
    id: 'pages.learn.map.steps.map.title',
    defaultMessage: 'Map through OpenStreetMap',
  },
  learnMapStepMapOSMDescription: {
    id: 'pages.learn.map.steps.map.description',
    defaultMessage:
      'If you are new to mapping we recommend checking the manuals below before you start mapping.',
  },
  learnSignUpTitle: {
    id: 'pages.learn.videos.signup.title',
    defaultMessage: 'Sign up on Tasking Manager',
  },
  learnSignUpDescription: {
    id: 'pages.learn.videos.signup.description',
    defaultMessage: 'Learn how to Sign Up on Tasking Manager.',
  },
  learnMapRoadsTitle: {
    id: 'pages.learn.videos.map_roads.title',
    defaultMessage: 'Mapping roads',
  },
  learnMapRoadsDescription: {
    id: 'pages.learn.videos.map_roads.description',
    defaultMessage: 'Learn how to map roads on OpenStreetMap.',
  },
  learnMapBuildingsTitle: {
    id: 'pages.learn.videos.map_buildings.title',
    defaultMessage: 'Select a task & mapping buildings',
  },
  learnMapBuildingsDescription: {
    id: 'pages.learn.videos.map_buildings.description',
    defaultMessage: 'Learn how to map buildings on OpenStreetMap.',
  },
  learnValidateHowToVideoTitle: {
    id: 'pages.learn.validate.video.title',
    defaultMessage: 'How to validate',
  },
  learnValidateHowToVideoDescription: {
    id: 'pages.learn.validate.video.description',
    defaultMessage: 'Learn how to start validating projects on Tasking Manager.',
  },
  learnValidateTrainingVideoTitle: {
    id: 'pages.learn.validate.training.video.title',
    defaultMessage: 'Validation training',
  },
  learnValidateTrainingVideoDescription: {
    id: 'pages.learn.validate.training.video.description',
    defaultMessage:
      'Deep dive on validation with this training, which includes advanced concepts and the JOSM editor.',
  },
  learnValidateTitle: {
    id: 'pages.learn.validate_title',
    defaultMessage: 'Learn to validate',
  },
  learnValidateIntro: {
    id: 'pages.learn.validate.intro',
    defaultMessage:
      'Validation is an important part of the process. It requires confidence in your mapping abilities as well as the willingness to help coach and advise newer mappers.',
  },
  learnValidateDescription: {
    id: 'pages.learn.validate.description',
    defaultMessage:
      'Getting a second, third, or fourth pair of eyes on mapped features is an important step for ensuring the quality of the data being added to OpenStreetMap and then used around the world.',
  },
  learnValidateStepIdentifyTitle: {
    id: 'pages.learn.validate.steps.identify.title',
    defaultMessage: 'Identify if becoming a validator is right for you',
  },
  learnValidateStepIdentifyDescription: {
    id: 'pages.learn.validate.steps.identify.description',
    defaultMessage:
      'Validation requires patience and attention to detail. Some experience mapping in OpenStreetMap is a must, but don’t feel that you need to be an expert to get started.',
  },
  learnValidateStepBuildTitle: {
    id: 'pages.learn.validate.steps.build.title',
    defaultMessage: 'Build your skills',
  },
  learnValidateStepBuildDescription: {
    id: 'pages.learn.validate.steps.build.description',
    defaultMessage:
      'Becoming a skilled mapper is crucial to start validating projects. Build up your experience in mapping all kinds of elements. Make sure you are familiar with the {taggingLink}. Eventually check out the JOSM Editor, a customizable editor for OpenStreetMap with a number of tools and plugins to make mapping and validation easier!',
  },
  learnValidateStepCollaborateTitle: {
    id: 'pages.learn.validate.steps.collaborate.title',
    defaultMessage: 'Collaborate as part of the community',
  },
  learnValidateStepCollaborateDescription: {
    id: 'pages.learn.validate.steps.collaborate.description',
    defaultMessage:
      'Different validators have different techniques for validating. Join the conversation on the {mailingListLink} or the {forumLink}. Contribute resources that you find helpful and give back to the community! ',
  },
  mailingLists: {
    id: 'pages.learn.validate.mailing_lists',
    defaultMessage: 'mailing lists',
  },
  forum: {
    id: 'pages.learn.validate.forum',
    defaultMessage: 'forum',
  },
  osmTaggingSchema: {
    id: 'pages.learn.validate.tagging_schema',
    defaultMessage: 'OpenStreetMap tagging schema',
  },
  learnValidateNote: {
    id: 'pages.learn.validate.note',
    defaultMessage:
      'After you become a skilled community mapper in OpenStreetMap, you will get confidence that you are ready to become a validator. You can apply to some of the validation teams or find a project that you want to validate on. Join the team, that will give you permission to validate the tasks. Now this is your opportunity to pay it forward and help other mappers on their journey as well',
  },
  learnManageTitle: {
    id: 'pages.learn.manage_title',
    defaultMessage: 'Learn to manage',
  },
  learnManageIntro: {
    id: 'pages.learn.manage.intro',
    defaultMessage:
      'Being able to organize mapping efforts is a huge opportunity for fast and coordinated data collection. In order to be successful you must be able to motivate a community of mappers.',
  },
  learnManageDescription: {
    id: 'pages.learn.manage.description',
    defaultMessage:
      'You can use the Tasking Manager to set up your own projects. Be sure to be responsible by making sure your skill level matches your ambition. It is good to reach out to the administrators of the Tasking Manager and learn more about what is needed to obtain the permissions to create and manage projects.',
  },
  learnManageStepJoinTitle: {
    id: 'pages.learn.manage.steps.join.title',
    defaultMessage: 'Become part of a community or organization',
  },
  learnManageStepJoinDescription: {
    id: 'pages.learn.manage.steps.join.description',
    defaultMessage:
      'The Tasking Manager allows you to create projects as part of a community or organization. Either get in touch with one you know, or request the admins to add your group to the Tasking Manager.',
  },
  learnManageStepCreateTitle: {
    id: 'pages.learn.manage.steps.create.title',
    defaultMessage: 'Create a project and be loud about it',
  },
  learnManageStepCreateDescription: {
    id: 'pages.learn.manage.steps.create.description',
    defaultMessage:
      'Get people on board to map for your project. We suggest monitoring the mapping on your projects. Make sure to get them properly mapped and completed.',
  },
  learnManageStepDataTitle: {
    id: 'pages.learn.manage.steps.data.title',
    defaultMessage: 'Use the data',
  },
  learnManageStepDataDescription: {
    id: 'pages.learn.manage.steps.data.description',
    defaultMessage:
      'Download the data and use it for your initial purpose. The {exportToolLink} and the {overpassLink} are excellent to pick the information you need.',
  },
  quickstartTitle: {
    id: 'pages.quickstart.title',
    defaultMessage: 'Quickstart guide',
  },
  quickstartIntro: {
    id: 'pages.quickstart.intro',
    defaultMessage:
      'These step-by-step instructions help you to get started mapping with the Tasking Manager on OpenStreetMap.',
  },
  quickstartStep1: {
    id: 'pages.quickstart.quickstartStep1',
    defaultMessage:
      'Click on the {signUp} button in the upper right corner of the {tmHomepage} homepage.',
  },
  quickstartStep1Note: {
    id: 'pages.quickstart.quickstartStep1Note',
    defaultMessage: 'Do you have an OpenStreetMap account already? You can skip ahead to step 4.',
  },
  quickstartStep2: {
    id: 'pages.quickstart.quickstartStep2',
    defaultMessage:
      'Provide your name and email address. We will use this information to guide you through the sign-up process.',
  },
  quickstartStep3: {
    id: 'pages.quickstart.quickstartStep3',
    defaultMessage:
      'A new tab will open allowing you to register on OpenStreetMap.org. Provide your account information and press the {signUp} button at the bottom of the form.',
  },
  quickstartStep4: {
    id: 'pages.quickstart.quickstartStep4',
    defaultMessage: 'Close the tab and go back to the {tmHomepage}. Click the button to {logIn}.',
  },
  quickstartStep5: {
    id: 'pages.quickstart.quickstartStep5',
    defaultMessage:
      'Select {exploreProjects} in the main navigation to find a project to help map. Or use the link provided by your mapathon instructor.',
  },
  quickstartStep6: {
    id: 'pages.quickstart.quickstartStep6',
    defaultMessage:
      'Read the introduction to the project and click on {contribute} to begin with a mapping task.',
  },
  quickstartStep7: {
    id: 'pages.quickstart.quickstartStep7',
    defaultMessage:
      'Map a randomly selected task for mapping by clicking on the button {mapATask}.',
  },
  quickstartStep7Note: {
    id: 'pages.quickstart.quickstartStep7Note',
    defaultMessage:
      'Alternatively, you can also select one from the  map or the task and choose “Map selected task”.',
  },
  quickstartStep8: {
    id: 'pages.quickstart.quickstartStep8',
    defaultMessage: 'This opens the editor; map all the features asked for in the instructions.',
  },
  quickstartStep8Note: {
    id: 'pages.quickstart.quickstartStep8Note',
    defaultMessage:
      'For more information on mapping in OpenStreetMap please have a look at our tutorials on the {learnPage}.',
  },
  quickstartStep9: {
    id: 'pages.quickstart.quickstartStep9',
    defaultMessage: 'When finished mapping, save your edits and select the button {submitTask}.',
  },
  quickstartStep9Note: {
    id: 'pages.quickstart.quickstartStep9Note',
    defaultMessage:
      'After this, you can go back to step 7 and select a new task for mapping. Thank you for your contribution to OpenStreetMap!',
  },
  contactUs: {
    id: 'pages.concact.title',
    defaultMessage: 'Contact Us',
  },
  contactUsThanksTitle: {
    id: 'home.contact.thanksTitle',
    defaultMessage: 'Thank You!',
  },
  contactUsThanksError: {
    id: 'home.contact.thanksError',
    defaultMessage: 'One moment, there was a problem sending your message.',
  },
  contactUsThanksBody: {
    id: 'home.contact.thanksBody',
    defaultMessage: "You'll be hearing from us soon!",
  },
  contactUsThanksProceed: {
    id: 'home.contact.thanksProceed',
    defaultMessage: 'Proceed',
  },
  tmDescription: {
    id: 'pages.about.description',
    defaultMessage:
      'The purpose of the Tasking Manager is to divide a large mapping project into smaller tasks that can be completed rapidly and collaboratively, with many people contributing to a collective project goal. The tool shows what needs to be mapped, which areas need to be reviewed and validated for quality assurance and which areas are completed.',
  },
  tmDescription2: {
    id: 'pages.about.description2',
    defaultMessage:
      'This approach allows the distribution of tasks to many individual mappers. It also allows monitoring of project progress and helps to improve the consistency of the mapping (e.g. elements to cover, specific tags to use, etc.)',
  },
  osmDescription: {
    id: 'pages.about.OpenStreetMap.description',
    defaultMessage:
      'All work is done through {osmLink}. OpenStreetMap is the community-driven free and editable map of the world, supported by the not-for-profit OpenStreetMap Foundation.',
  },
  osmWiki: {
    id: 'pages.about.OpenStreetMap.wiki',
    defaultMessage:
      'Read more on the {osmWikiLink} or join the discussion with your local OSM community.',
  },
  sustainabilityModel: {
    id: 'pages.about.sustainabilityModel',
    defaultMessage: 'Access the {faqs} for services and support information.',
  },
  smFAQ: {
    id: 'pages.about.sustainabilityModel.faq',
    defaultMessage: 'Tasking Manager Sustainability Model FAQs',
  },
  floss: {
    id: 'pages.about.floss.title',
    defaultMessage: 'Free and Open Source Software',
  },
  flossDescription: {
    id: 'pages.about.floss.description',
    defaultMessage:
      'The Tasking Manager is Free and Open Source software developed by the {hotLink}. The application’s code can be accessed through {code}, where you can report issues and make contributions.',
  },
  editProject: {
    id: 'pages.edit_project.title',
    defaultMessage: 'Edit project',
  },
  save: {
    id: 'pages.edit_project.buttons.save',
    defaultMessage: 'Save',
  },
  accessProject: {
    id: 'pages.edit_project.buttons.access_project',
    defaultMessage: 'Access project',
  },
  projectPage: {
    id: 'pages.edit_project.buttons.project_page',
    defaultMessage: 'Project page',
  },
  tasksPage: {
    id: 'pages.edit_project.buttons.task_selection_page',
    defaultMessage: 'Task selection page',
  },
  projectStats: {
    id: 'pages.edit_project.buttons.project_stats',
    defaultMessage: 'Project statistics',
  },
  updateSuccess: {
    id: 'pages.edit_project.actions.update.success',
    defaultMessage: 'Project updated successfully.',
  },
  saveProjectError: {
    id: 'pages.edit_project.actions.update.data_error',
    defaultMessage: 'It was not possible to save the project.',
  },
  serverError: {
    id: 'pages.edit_project.actions.update.error',
    defaultMessage:
      'Saving the project failed because of a Server Error. Please try again later or contact the administrator if problem persists.',
  },
  missingFields: {
    id: 'pages.edit_project.actions.missing_fields',
    defaultMessage:
      '{number, plural, one {One required field is missing:} plural {Some required fields are missing:}}',
  },
  missingFieldsForLocale: {
    id: 'pages.edit_project.actions.missing_fields_for_locale',
    defaultMessage: "Missing information on the project's default language ({locale}):",
  },
  projectEditSection_description: {
    id: 'pages.edit_project.sections.description',
    defaultMessage: 'Description',
  },
  projectEditSection_instructions: {
    id: 'pages.edit_project.sections.instructions',
    defaultMessage: 'Instructions',
  },
  projectEditSection_metadata: {
    id: 'pages.edit_project.sections.metadata',
    defaultMessage: 'Metadata',
  },
  projectEditSection_priority_areas: {
    id: 'pages.edit_project.sections.priority_areas',
    defaultMessage: 'Priority areas',
  },
  projectEditSection_imagery: {
    id: 'pages.edit_project.sections.imagery',
    defaultMessage: 'Imagery',
  },
  projectEditSection_permissions: {
    id: 'pages.edit_project.sections.permissions',
    defaultMessage: 'Permissions',
  },
  projectEditSection_settings: {
    id: 'pages.edit_project.sections.settings',
    defaultMessage: 'Settings',
  },
  projectEditSection_actions: {
    id: 'pages.edit_project.sections.actions',
    defaultMessage: 'Actions',
  },
  projectEditSection_custom_editor: {
    id: 'pages.edit_project.sections.custom_editor',
    defaultMessage: 'Custom Editor',
  },
  duplicateCampaign: {
    id: 'pages.create_campaign.duplicate',
    defaultMessage: 'A campaign with the same name already exists',
  },
  campaignError: {
    id: 'pages.create_campaign.error',
    defaultMessage: 'There was an error saving this campaign.',
  },
});
