import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on homepage.
 */
export default defineMessages({
  jumbotronTitle: {
    id: 'home.mainSection.title',
    defaultMessage: 'Map for people in need',
  },
  jumbotronHeadLine: {
    id: 'home.mainSection.lead',
    defaultMessage:
      'Join a global community that is mapping the places most vulnerable to disaster and poverty in order to support humanitarian aid and sustainable development across the world.',
  },
  secJumbotronTitle: {
    id: 'home.callToAction.title',
    defaultMessage: "We can't do it without you",
  },
  secJumbotronHeadLine: {
    id: 'home.callToAction.firstLeadLine',
    defaultMessage:
      'Anyone can contribute to the map. If you have never mapped before and would like to get started, visit our {link} page.',
  },
  secJumbotronHeadLine2: {
    id: 'home.callToAction.secondLeadLine',
    defaultMessage:
      'Are you an experienced mapper? Click below to see what projects are available for mapping.',
  },
  featuredProjects: {
    id: 'home.featuredProjects.title',
    defaultMessage: 'Featured Projects',
  },
  howItWorks: {
    id: 'home.callToAction.learnLink',
    defaultMessage: 'How it works',
  },
  startButton: {
    id: 'home.mainSection.button.start',
    defaultMessage: 'Start mapping',
  },
  joinButton: {
    id: 'home.mainSection.button.join',
    defaultMessage: 'Join the community',
  },
  buildingsStats: {
    id: 'home.stats.buildings',
    defaultMessage: 'Buildings Mapped',
  },
  roadsStats: {
    id: 'home.stats.roads',
    defaultMessage: 'Mapped Roads (Km)',
  },
  editsStats: {
    id: 'home.stats.edits',
    defaultMessage: 'Total Map Edits',
  },
  communityStats: {
    id: 'home.stats.community',
    defaultMessage: 'Total Mappers',
  },
  mappersStats: {
    id: 'home.stats.mappers',
    defaultMessage: 'Mappers Online',
  },
  statsLoadingError: {
    id: 'home.stats.loading.error',
    defaultMessage: 'An error occured while loading the stats',
  },
  mappingFlowTitle: {
    id: 'home.mappingFlow.title',
    defaultMessage:
      'Each year, disasters around the world kill nearly {number} and affect or displace 200 million people. Mapping can help change this.',
  },
  mappingFlowHeadline: {
    id: 'home.mappingFlow.headLine',
    defaultMessage:
      'Organizations use Tasking Manager to create mapping projects for areas around the world where data is needed to help save or improve lives.',
  },
  mappingCardTitle: {
    id: 'home.mappingFlow.cards.mapping.title',
    defaultMessage: 'Mapping',
  },
  validationCardTitle: {
    id: 'home.mappingFlow.cards.validation.title',
    defaultMessage: 'Validation',
  },
  usingDataCardTitle: {
    id: 'home.mappingFlow.cards.usingData.title',
    defaultMessage: 'Using the data',
  },
  mappingCardDescription: {
    id: 'home.mappingFlow.cards.mapping.description',
    defaultMessage:
      'Volunteers use satellite imagery from OpenStreetMap to trace buildings, roadways, and other features.',
  },
  validationCardDescription: {
    id: 'home.mappingFlow.cards.validation.description',
    defaultMessage: 'Experienced volunteers check the map data to ensure it is high quality.',
  },
  usingDataCardDescription: {
    id: 'home.mappingFlow.cards.usingData.description',
    defaultMessage:
      'Humanitarian organizations use the map data to plan for disaster response and other life saving activities.',
  },
  whoIsMappingTitle: {
    id: 'home.whoIsMapping.title',
    defaultMessage: 'Who uses the maps?',
  },
  whoIsMappingHeadline: {
    id: 'home.whoIsMapping.headline',
    defaultMessage:
      'Trusted global organizations use Tasking Manager to get the map data they need to reach those in need.',
  },
  organizationContactTitle: {
    id: 'home.whoIsMapping.contact.title',
    defaultMessage: 'Does your organization want to work with us?',
  },
  organizationContactButton: {
    id: 'home.whoIsMapping.contact.button',
    defaultMessage: 'Contact us',
  },
  errorLoadingTheX: {
    id: 'home.featuredProjects.error',
    defaultMessage: 'Error loading the {xWord}',
  },
  contacterTitle: {
    id: 'home.contact.contacterTitle',
    defaultMessage: 'Send us a message',
  },
  contacterName: {
    id: 'home.contact.contacterName',
    defaultMessage: 'Name',
  },
  contacterEmail: {
    id: 'home.contact.contacterEmail',
    defaultMessage: 'Email',
  },
  contacterMessage: {
    id: 'home.contact.contacterMessage',
    defaultMessage: 'Message',
  },
  contacterHeaderText: {
    id: 'home.contact.contacterHeadText',
    defaultMessage:
      'Want to discuss working with us? Or, have a question or feedback that you would like to share? Fill out the form below to contact our team.',
  },
  contacterSend: {
    id: 'home.contact.submit',
    defaultMessage: 'Send',
  },
  serviceDesk: {
    id: 'home.contact.serviceDesk',
    defaultMessage: 'Service Desk',
  },
  contactServiceDesk: {
    id: 'home.contact.serviceDesk.description',
    defaultMessage: 'You can also contact us through our <b>{link}</b>.',
  },
  testimonialsTitle: {
    id: 'home.testimonials.title',
    defaultMessage: 'You can make a difference',
  },
  ifrcCitation: {
    id: 'home.testimonials.ifrc.citation',
    defaultMessage:
      'In the early days of the Cyclone Idai response, IFRC was looking for detailed maps to get a sense of the scale of the flooding, which were also used for search and rescue operations. Later on, we had requests to identify where certain buildings, such as health centres or hospitals, were located so our health team could assess the damage and medical needs of patients.',
  },
  ifrcBio: {
    id: 'home.testimonials.ifrc.bio',
    defaultMessage: 'Remote Coordinator for the IFRC Information Management Team for Cyclone Idai',
  },
  statsTooltip: {
    id: 'home.statsTooltip',
    defaultMessage:
      'These statistics come from ohsomeNow Stats and were last updated at {formattedDate} ({timeZone}). Missing fields will be made available soon!',
  },
});
