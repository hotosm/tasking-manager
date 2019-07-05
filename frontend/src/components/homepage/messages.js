import { defineMessages } from 'react-intl'


/**
 * Internationalized messages for use on header.
 */
export default defineMessages({
  jumbotronTitle: {
    id: 'home.mainSection.title',
    defaultMessage: 'Map a task for people in need'
  },
  jumbotronHeadLine: {
    id: 'home.mainSection.lead',
    defaultMessage: "Join a global community that is helping to put the world's most vulnerable people and places on the map towards humanitarian aid and sustainable development."
  },
  startButton: {
    id: 'home.mainSection.button.start',
    defaultMessage: 'Start mapping'
  },
  joinButton: {
    id: 'home.mainSection.button.join',
    defaultMessage: 'Join the community'
  },
  buildingsStats: {
    id: 'home.stats.buildings',
    defaultMessage: 'Buildings Mapped'
  },
  roadsStats: {
    id: 'home.stats.roads',
    defaultMessage: 'Mapped Roads (Km)'
  },
  editsStats: {
    id: 'home.stats.edits',
    defaultMessage: 'Total Map Edits'
  },
  communityStats: {
    id: 'home.stats.community',
    defaultMessage: 'Community Mappers'
  },
  mappersStats: {
    id: 'home.stats.mappers',
    defaultMessage: 'Mappers Online'
  }
});
