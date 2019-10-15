import React from 'react';
require('iD/dist/iD.min.js');

export class IdEditor extends React.Component {
  componentDidMount() {
      let id = iD.coreContext();

      // disable boundaries (unless we have an explicit disable_features list)
      var q = iD.utilStringQs(window.location.hash.substring(1));
      if (!q.hasOwnProperty('disable_features')) {
          id.features().disable('boundaries');
      }

      id.ui()(document.getElementById('id-container'), function() {
          id.container().select('#about-list')
              .insert('li', '.user-list')
              .attr('class', 'source-switch')
              .call(iD.uiSourceSwitch(id)
                  .keys([
                      {
                          'urlroot': 'https://www.openstreetmap.org',
                          'oauth_consumer_key': '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
                          'oauth_secret': 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL'
                      },
                      {
                          'urlroot': 'https://api06.dev.openstreetmap.org',
                          'oauth_consumer_key': 'zwQZFivccHkLs3a8Rq5CoS412fE5aPCXDw9DZj7R',
                          'oauth_secret': 'aMnOOCwExO2XYtRVWJ1bI9QOdqh1cay2UgpbhA6p'
                      }
                  ])
              );
      });

  }
  render() {
    return <div id="map"></div>
  }
}

