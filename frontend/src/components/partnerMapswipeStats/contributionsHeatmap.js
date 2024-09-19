import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { latLngToCell, cellToBoundary } from 'h3-js';
import { FormattedMessage } from 'react-intl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { MAPBOX_TOKEN, MAP_STYLE } from '../../config';
import { CHART_COLOURS } from '../../config';
import { geoJSON } from './geoJsonData';
import { ZoomPlusIcon, ZoomMinusIcon } from '../svgIcons';
import messages from './messages';
import './contributionsHeatmap.css';

mapboxgl.accessToken = MAPBOX_TOKEN;

export const ContributionsHeatmap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [zoom, setZoom] = useState(1.25);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [0, 0],
      zoom: zoom,
    });

    map.current.scrollZoom.disable();

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

    map.current.on('wheel', (event) => {
      if (event.originalEvent.ctrlKey) {
        // Check if CTRL key is pressed
        event.originalEvent.preventDefault(); // Prevent chrome/firefox default behavior
        if (!map.current.scrollZoom._enabled) map.current.scrollZoom.enable(); // Enable zoom only if it's disabled
      } else {
        if (map.current.scrollZoom._enabled) map.current.scrollZoom.disable(); // Disable zoom only if it's enabled
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    map.current.zoomTo(zoom, { duration: 700 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  const handleZoom = (isZoomingOut = false) => {
    const currentZoom = parseFloat(zoom);
    if (!isZoomingOut) {
      setZoom(currentZoom + 0.5);
    } else {
      if (currentZoom.toFixed(2) === '0.75') return;
      setZoom(currentZoom - 0.5);
    }
  };

  const shouldDisableZoomOut = zoom === '0.75' || zoom === 0.75;

  return (
    <div>
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb4">
        <FormattedMessage {...messages.contributionsHeatmap} />
      </h3>

      <div className="relative partner-mapswipe-heatmap-wrapper">
        <div ref={mapContainer} style={{ width: '100%', height: '650px' }} className="shadow-6" />
        <div className="flex items-center justify-between absolute top-0 left-0 right-0 pa2">
          <div className="bg-white flex pa2 pv1 items-center ba b--black-20 br2">
            <ZoomMinusIcon
              height={20}
              className={`br b--black-20 pr2 pointer ${
                shouldDisableZoomOut ? 'moon-gray' : 'blue-dark'
              }`}
              onClick={() => handleZoom(true)}
            />
            <ZoomPlusIcon
              height={20}
              className="blue-dark pl2 pointer"
              onClick={() => handleZoom()}
            />
          </div>
          <p
            className="ma0 pa1 bg-white ba b--black-20 br2 partner-mapswipe-heatmap-zoom-text"
            style={{ userSelect: 'none' }}
          >
            Use Ctrl + Scroll to zoom
          </p>
        </div>
      </div>
    </div>
  );
};
