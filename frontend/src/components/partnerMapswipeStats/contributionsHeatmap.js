import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { latLngToCell, cellToBoundary } from 'h3-js';
import { FormattedMessage } from 'react-intl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { MAPBOX_TOKEN, MAP_STYLE } from '../../config';
import { CHART_COLOURS } from '../../config';
import { geoJSON } from './geoJsonData';
import messages from './messages';

mapboxgl.accessToken = MAPBOX_TOKEN;

export const ContributionsHeatmap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(0);
  const [lat, setLat] = useState(0);
  const [zoom, setZoom] = useState(1.25);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [lng, lat],
      zoom: zoom,
      bearing: 0,
      pitch: 0,
    });

    const getStyle = (row) => {
      const styles = [
        {
          color: CHART_COLOURS.orange,
          opacity: 0.2,
        },
        {
          color: CHART_COLOURS.orange,
          opacity: 0.4,
        },
        {
          color: CHART_COLOURS.orange,
          opacity: 0.6,
        },
        {
          color: CHART_COLOURS.orange,
          opacity: 0.7,
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

    map.current.on('load', () => {
      const hexagonsArrayCopy = geoJSON.map((data) => {
        const h3Index = latLngToCell(data.geojson.coordinates[1], data.geojson.coordinates[0], 1);
        return {
          hexindex7: h3Index,
          totalContributionCount: data.totalContribution,
        };
      });

      const features = hexagonsArrayCopy.map((row) => {
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

      map.current.addSource('hexbin', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features,
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

    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, []);

  return (
    <div>
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb4">
        <FormattedMessage {...messages.contributionsHeatmap} />
      </h3>

      <div ref={mapContainer} style={{ width: '100%', height: '650px' }} className="shadow-6" />
    </div>
  );
};
