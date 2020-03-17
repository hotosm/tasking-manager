import React, { useEffect } from 'react';
import * as iD from 'id/dist/index';
import 'id/dist/iD.css';

import { OSM_CONSUMER_KEY, OSM_CONSUMER_SECRET } from '../config'

export default function Editor() {
	useEffect(
	  () => {
			if (window && iD) {
				let idContext = window.iD.coreContext();
				idContext.embed(true).assetPath('/static/');
				idContext.preauth({
          urlroot: 'https://www.openstreetmap.org',
          oauth_consumer_key: OSM_CONSUMER_KEY,
          oauth_secret: OSM_CONSUMER_SECRET,
          oauth_token: '',
          oauth_token_secret: '',
        });
				idContext.init();
				// disable boundaries (unless we have an explicit disable_features list)
				// var q = window.iD.utilStringQs(window.location.hash.substring(1));
				// if (!q.hasOwnProperty('disable_features')) {
				// 	idContext.features().disable('boundaries');
				// }
				idContext.ui()(document.getElementById('id-container'), function() {
					idContext.container()
						.select('#about-list')
						.insert('li', '.user-list')
						.attr('class', 'source-switch')
						// .call(
						// 	window.iD.uiSourceSwitch(idContext).keys([
						// 		{
						// 			urlroot: 'https://www.openstreetmap.org',
						// 			oauth_consumer_key: 'Q09CnRAXDwihla04IrYdOMsl9lvmNHvIBU3waUMp',
						// 			oauth_secret: '2QgtdVPL5MKMwIH8seABv7YVjNqVXySBg5Eu7Ayj',
						// 			oauth_token: '',
						// 			oauth_token_secret: ''
						// 		},
						// 		{
						// 			urlroot: 'https://api06.dev.openstreetmap.org',
						// 			oauth_consumer_key: 'zwQZFivccHkLs3a8Rq5CoS412fE5aPCXDw9DZj7R',
						// 			oauth_secret: 'aMnOOCwExO2XYtRVWJ1bI9QOdqh1cay2UgpbhA6p',
						// 		},
						// 	]),
						// );
				});
			}
	  }, []
	);

  return (
		<div style={{height: "1000px"}} id="id-container"></div>
	);
}
