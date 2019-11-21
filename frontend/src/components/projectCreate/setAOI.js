import React, { useState } from 'react';
import * as turf from '@turf/turf';
import { paintOptions } from './create';

var tj = require('@mapbox/togeojson');
var osmtogeojson = require('osmtogeojson');
var shp = require('shpjs');

export default function SetAOI({ mapObj, metadata, updateMetadata }) {
  const [arbitraryTasks, setArbitrary] = useState(metadata.arbitraryTasks);
  const layer_name = 'aoi';

  const setDataGeom = event => {
    const geom = event.features[0].geometry;

    const area = turf.area(geom) / 1e6;
    mapObj.map.fitBounds(turf.bbox(geom), { padding: 20 });
    updateMetadata({
      ...metadata,
      geom: event,
      area: area.toFixed(2),
    });

    if (mapObj.map.getLayer(layer_name)) {
      mapObj.map.removeLayer(layer_name);
    }
    if (mapObj.map.getSource(layer_name)) {
      mapObj.map.removeSource(layer_name);
    }

    mapObj.map.addLayer({
      id: layer_name,
      type: 'fill',
      source: {
        type: 'geojson',
        data: geom,
      },
      paint: paintOptions,
    });
  };

  const uploadFile = event => {
    setArbitrary(true);

    let files = event.target.files;
    let file = files[0];
    const format = file.name.split('.')[1].toLowerCase();

    let fileReader = new FileReader();
    fileReader.onload = e => {
      let geom = null;
      switch (format) {
        case 'json':
          geom = JSON.parse(e.target.result);
          break;
        case 'kml':
          let kml = new DOMParser().parseFromString(e.target.result, 'text/xml');
          geom = tj.kml(kml);
          break;
        case 'osm':
          let xml = new DOMParser().parseFromString(e.target.result, 'text/xml');
          geom = osmtogeojson(xml);
          break;
        case 'zip':
          shp(e.target.result).then(function(geom) {
            setDataGeom(geom);
          });
          break;
        default:
          break;
      }
      if (format !== 'zip') {
        setDataGeom(geom);
      }
    };

    if (format === 'zip') {
      fileReader.readAsArrayBuffer(file);
    } else {
      fileReader.readAsText(file);
    }
  };

  const deleteHandler = () => {
    mapObj.map.removeLayer(layer_name);
    mapObj.map.removeSource(layer_name);
  };

  const drawHandler = () => {
    const updateArea = event => {
      // Validate area first.
      const id = event.features[0].id;
      const geom = turf.featureCollection(event.features)
      mapObj.draw.delete(id);
      setArbitrary(false);
      setDataGeom(geom);
    };

    mapObj.map.once('draw.create', updateArea);

    mapObj.draw.changeMode('draw_polygon');
  };

  return (
    <>
      <h3 className="f3 fw6 mt2 mb3 ttu barlow-condensed blue-dark">Step 1: Define Area</h3>
      <div className="pb4">
        <h3>Option 1:</h3>
        <p>Draw the Area of Interest on the map</p>
        <button
          className="bg-blue-dark white v-mid dn dib-ns br1 f5 bn ph4-l pv2-l mr2"
          type="button"
          onClick={drawHandler}
        >
          Draw
        </button>
        <button
          className="bg-blue-dark white v-mid dn dib-ns br1 f5 bn ph4-l pv2-l"
          type="button"
          onClick={deleteHandler}
        >
          Delete
        </button>
      </div>

      <div>
        <h3>Option 2:</h3>
        <p>Import a GeoJSON, KML, OSM or zipped SHP file.</p>
        <div className="pb2">
          <input
            type="checkbox"
            defaultChecked={metadata.arbitraryTasks}
            onChange={() => {
              if (arbitraryTasks === true) {
                updateMetadata({ ...metadata, arbitraryTasks: !metadata.arbitraryTasks });
              }
            }}
          />
          &nbsp; Arbitrary tasks
        </div>
        <label
          for="file-upload"
          className="bg-blue-dark white v-mid dn dib-ns br1 f5 bn ph4-l pv2-l"
        >
          Import
        </label>
        <input onChange={uploadFile} style={{ display: 'none' }} id="file-upload" type="file" />
      </div>
    </>
  );
}
