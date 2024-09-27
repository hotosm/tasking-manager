import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { latLngToCell, cellToBoundary } from 'h3-js';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import 'mapbox-gl/dist/mapbox-gl.css';

import { MAPBOX_TOKEN, MAP_STYLE, CHART_COLOURS } from '../../config';
import messages from './messages';
import './contributionsHeatmap.css';

mapboxgl.accessToken = MAPBOX_TOKEN;

export const ContributionsHeatmap = ({ contributionsByGeo = [] }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [0, 0],
      zoom: 1.25,
    });

    map.current.scrollZoom.disable();
    map.current.addControl(new mapboxgl.NavigationControl());

    const getStyle = (row) => {
      const styles = [
        {
          color: CHART_COLOURS.red,
          opacity: 0.2,
        },
        {
          color: CHART_COLOURS.red,
          opacity: 0.3,
        },
        {
          color: CHART_COLOURS.red,
          opacity: 0.4,
        },
        {
          color: CHART_COLOURS.red,
          opacity: 0.6,
        },
        {
          color: CHART_COLOURS.red,
          opacity: 0.8,
        },
      ];

      if (Number(row.totalContributionCount) === 0) {
        return { opacity: 0 };
      }

      if (Number(row.totalContributionCount) < 250) {
        return styles[0];
      }
      if (Number(row.totalContributionCount) < 500) {
        return styles[1];
      }
      if (Number(row.totalContributionCount) < 1000) {
        return styles[2];
      }
      if (Number(row.totalContributionCount) < 1500) {
        return styles[3];
      }
      return styles[4];
    };

    const getHexagonFeatures = (res = 1) => {
      const hexagonsArray = contributionsByGeo.map((data) => {
        const h3Index = latLngToCell(data.geojson.coordinates[1], data.geojson.coordinates[0], res);
        return {
          hexindex7: h3Index,
          totalContributionCount: data.totalContribution,
        };
      });

      const features = hexagonsArray.map((row) => {
        const style = getStyle(row);
        return {
          type: 'Feature',
          properties: {
            color: style.color,
            opacity: style.opacity,
            id: row.hexindex7,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [cellToBoundary(row.hexindex7, true)],
          },
        };
      });

      return features;
    };

    const zoomToH3ResMapping = {
      1: 1,
      2: 2,
      3: 2,
      4: 3,
      5: 3,
      6: 4,
      7: 4,
      8: 5,
      9: 6,
      10: 6,
      11: 7,
      12: 7,
      13: 8,
      14: 8,
      15: 9,
      16: 10,
      17: 10,
      18: 11,
      19: 12,
      20: 13,
      21: 13,
      22: 14,
      23: 15,
      24: 15,
    };

    map.current.on('load', () => {
      map.current.addSource('hexbin', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: getHexagonFeatures(),
        },
      });

      map.current.addLayer({
        id: 'polyline-layer',
        type: 'fill',
        source: 'hexbin',
        paint: {
          'fill-outline-color': 'white',
          'fill-color': ['get', 'color'],
          'fill-opacity': ['get', 'opacity'],
        },
      });

      map.current.addLayer({
        id: 'hexbin-outline',
        type: 'line',
        source: 'hexbin',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1,
        },
      });
    });

    map.current.on('wheel', (event) => {
      if (event.originalEvent.ctrlKey) {
        // Check if CTRL key is pressed
        event.originalEvent.preventDefault(); // Prevent chrome/firefox default behavior
        if (!map.current.scrollZoom._enabled) map.current.scrollZoom.enable(); // Enable zoom only if it's disabled
      } else if (map.current.scrollZoom._enabled) {
        map.current.scrollZoom.disable(); // Disable zoom only if it's enabled
      }
    });

    map.current.on('zoomend', () => {
      const currentZoom = map.current.getZoom();
      const h3ResBasedOnZoom =
        currentZoom >= 1
          ? zoomToH3ResMapping[parseInt(currentZoom)] ?? Math.floor((currentZoom - 2) * 0.7)
          : 1;

      map.current.getSource('hexbin').setData({
        type: 'FeatureCollection',
        features: getHexagonFeatures(h3ResBasedOnZoom),
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb4">
        <FormattedMessage {...messages.contributionsHeatmap} />
      </h3>

      <div className="relative partner-mapswipe-heatmap-wrapper">
        <div ref={mapContainer} style={{ width: '100%', height: '650px' }} className="shadow-6" />
        <div className="flex items-center justify-start absolute top-0 left-0 right-0 pa2">
          <p className="ma0 pa1 bg-blue-dark white ba b--black-20 br2 partner-mapswipe-heatmap-zoom-text">
            Use Ctrl + Scroll to zoom
          </p>
        </div>
      </div>
    </div>
  );
};

ContributionsHeatmap.propTypes = {
  contributionsByGeo: PropTypes.arrayOf(
    PropTypes.shape({
      totalcontributions: PropTypes.number,
      geojson: PropTypes.shape({
        type: PropTypes.string,
        coordinates: PropTypes.array,
      }),
    }),
  ),
};
