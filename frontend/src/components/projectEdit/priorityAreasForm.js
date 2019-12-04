import React, { useState, useContext, useLayoutEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import DrawRectangle from 'mapbox-gl-draw-rectangle-mode';

import { StateContext, styleClasses } from '../../views/projectEdit';
import { fallbackRasterStyle } from '../projects/projectsMap';
import { Button } from '../button';
import { MAPBOX_TOKEN } from '../../config';

const MapboxDraw = require('@mapbox/mapbox-gl-draw');

mapboxgl.accessToken = MAPBOX_TOKEN;

export const PriorityAreasForm = () => {
	const { projectInfo, setProjectInfo } = useContext(StateContext);
	const [map, setMap] = useState(null);

	const mapRef = React.createRef();
	const modes = MapboxDraw.modes;
	modes.draw_rectangle = DrawRectangle;

	const draw = useState(
		new MapboxDraw({
			displayControlsDefault: false,
			modes: modes,
			styles: [
				{
					id: 'gl-draw-polygon-fill-inactive',
					type: 'fill',
					paint: {
						'fill-color': '#00004d',
						'fill-opacity': 0.6,
					},
				},
			],
		}),
	);

	useLayoutEffect(() => {
		setMap(
			new mapboxgl.Map({
				container: mapRef.current,
				style: MAPBOX_TOKEN ? 'mapbox://styles/mapbox/bright-v9' : fallbackRasterStyle,
				zoom: 0,
			}),
		);
		return () => {
			map && map.remove();
		};
		// eslint-disable-next-line
	}, []);

	useLayoutEffect(() => {
		if (map !== null) {
			map.on('load', () => {
				let priorityAreas = projectInfo.priorityAreas;
				if (priorityAreas === null) {
					priorityAreas = [];
				}

				// update As features
				const drawPriorityAreas = priorityAreas.map(a => ({
					type: 'Feature',
					properties: {},
					geometry: a,
				}));

				map.addControl(draw[0]);
				map.addSource('aoi', {
					type: 'geojson',
					data: projectInfo.areaOfInterest,
				});

				map.addLayer({
					id: 'aoi',
					source: 'aoi',
					type: 'fill',
					paint: {
						'fill-color': '#00004d',
						'fill-opacity': 0.2,
					},
				});

				map.fitBounds(projectInfo.aoiBBOX, { duration: 0, padding: 100 });

				// Render priority areas.
				map.addSource('priority_areas', {
					type: 'geojson',
					data: { type: 'FeatureCollection', features: drawPriorityAreas },
				});

				map.addLayer({
					id: 'priority_areas',
					source: 'priority_areas',
					type: 'fill',
					paint: {
						'fill-color': '#00004d',
						'fill-opacity': 0.4,
					},
				});

				map.on('draw.create', e => {
					priorityAreas.push(e.features[0].geometry);
					setProjectInfo({ ...projectInfo, priorityAreas: priorityAreas });
				});
			});
		}
	}, [map, draw, projectInfo, setProjectInfo]);

	const clearButtonClass = styleClasses.buttonClass.concat(' bg-light-silver ttu');

	const clearAll = e => {
		draw[0].deleteAll();
		map.removeLayer('priority_areas');
		map.removeSource('priority_areas');
		setProjectInfo({ ...projectInfo, priorityAreas: [] });
	};

	return (
		<div className="w-100">
			<p className={styleClasses.pClass}>
				If you want mappers to work on the highest priority areas first, draw one of more polygons
				within the project area.
			</p>
			<div className="ttu">
				<Button
					className={styleClasses.drawButtonClass}
					onClick={() => draw[0].changeMode('draw_polygon')}
				>
					draw polygon
				</Button>
				<Button
					className={styleClasses.drawButtonClass}
					onClick={() => draw[0].changeMode('draw_rectangle')}
				>
					draw rectangle
				</Button>
				<Button onClick={clearAll} className={clearButtonClass}>
					clear all
				</Button>
			</div>

			<div id="map" ref={mapRef} className="vh-50 w-75"></div>
		</div>
	);
};
