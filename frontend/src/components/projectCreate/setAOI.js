import React from 'react';
import area from '@turf/area';
import bbox from '@turf/bbox';
import { featureCollection } from '@turf/helpers';
import lineToPolygon from '@turf/line-to-polygon';
import { FormattedMessage } from 'react-intl';
import { useDropzone } from 'react-dropzone';

import messages from './messages';
import { addLayer } from './index';
import { UndoIcon } from '../svgIcons';
import { Button } from '../button';
import { SwitchToggle } from '../formInputs';
import { makeGrid } from './setTaskSizes';
import { useContainsMultiplePolygons } from '../../hooks/UseGeomContainsMultiplePolygons';
import { MAX_FILESIZE } from '../../config';

var tj = require('@mapbox/togeojson');
var osmtogeojson = require('osmtogeojson');
var shp = require('shpjs');

export default function SetAOI({ mapObj, metadata, updateMetadata, setErr }) {
  const { containsMultiplePolygons } = useContainsMultiplePolygons(metadata.geom);
  const layer_name = 'aoi';

  const setDataGeom = (geom, display) => {
    mapObj.map.fitBounds(bbox(geom), { padding: 20 });
    const geomArea = area(geom) / 1e6;
    const zoomLevel = 11;
    const grid = makeGrid(geom, zoomLevel, {});
    updateMetadata({
      ...metadata,
      geom: geom,
      area: geomArea.toFixed(2),
      zoomLevel: zoomLevel,
      taskGrid: grid,
      tempTaskGrid: grid,
    });

    if (display === true) {
      addLayer('aoi', geom, mapObj.map);
    }
  };

  const validateFeature = (e, supportedGeoms, err) => {
    if (supportedGeoms.includes(e.geometry.type) === false) {
      err.message = (
        <FormattedMessage {...messages.unsupportedGeom} values={{ geometry: e.geometry.type }} />
      );

      throw err;
    }

    // Transform lineString to polygon
    if (e.geometry.type === 'LineString') {
      const coords = e.geometry.coordinates;
      if (JSON.stringify(coords[0]) !== JSON.stringify(coords[coords.length - 1])) {
        err.message = <FormattedMessage {...messages.closedLinestring} />;
        throw err;
      }
      const polygon = lineToPolygon(e);
      return polygon;
    }

    return e;
  };

  const verifyAndSetData = (event) => {
    let err = { code: 403, message: null };

    try {
      if (event.type !== 'FeatureCollection') {
        err.message = <FormattedMessage {...messages.noFeatureCollection} />;
        throw err;
      }
      // Validate geometry for each feature.
      const supportedGeoms = ['Polygon', 'MultiPolygon', 'LineString'];
      const features = event.features.map((e) => validateFeature(e, supportedGeoms, err));

      event.features = features;
      setDataGeom(event, true);
    } catch (e) {
      deleteHandler();
      setErr({ error: true, message: e.message });
    }
  };

  const uploadFile = (files) => {
    let file = files[0];
    if (!file) {
      return null;
    }
    if (file.size >= MAX_FILESIZE) {
      setErr({
        error: true,
        message: (
          <FormattedMessage {...messages.fileSize} values={{ fileSize: MAX_FILESIZE / 1000000 }} />
        ),
      });
      return null;
    }

    const format = file.name.split('.')[1].toLowerCase();

    const readFile = (e) => {
      let geom = null;
      switch (format) {
        case 'json':
        case 'geojson':
          geom = JSON.parse(e.target.result);
          break;
        case 'kml':
          let kml = new DOMParser().parseFromString(e.target.result, 'text/xml');
          geom = tj.kml(kml);
          break;
        case 'osm':
          let osm = new DOMParser().parseFromString(e.target.result, 'text/xml');
          geom = osmtogeojson(osm);
          break;
        case 'xml':
          let xml = new DOMParser().parseFromString(e.target.result, 'text/xml');
          geom = osmtogeojson(xml);
          break;
        case 'zip':
          shp(e.target.result).then(function (geom) {
            verifyAndSetData(geom);
          });
          break;
        default:
          break;
      }
      if (format !== 'zip') {
        verifyAndSetData(geom);
      }
    };

    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        readFile(e);
      } catch (err) {
        setErr({
          error: true,
          message: <FormattedMessage {...messages.invalidFile} />,
        });
      }
    };

    if (format === 'zip') {
      fileReader.readAsArrayBuffer(file);
    } else {
      fileReader.readAsText(file);
    }
  };

  const deleteHandler = () => {
    const features = mapObj.draw.getAll();
    if (features.features.length > 0) {
      const id = features.features[0].id;
      mapObj.draw.delete(id);
    }

    if (mapObj.map.getLayer(layer_name)) {
      mapObj.map.removeLayer(layer_name);
    }
    if (mapObj.map.getSource(layer_name)) {
      mapObj.map.removeSource(layer_name);
    }
    updateMetadata({ ...metadata, area: 0, geom: null });
  };

  const drawHandler = () => {
    const updateArea = (event) => {
      const features = mapObj.draw.getAll();
      if (features.features.length > 1) {
        const id = features.features[0].id;
        mapObj.draw.delete(id);
      }

      // Validate area first.
      const geom = featureCollection(event.features);
      setDataGeom(geom, false);
    };

    mapObj.map.on('draw.update', updateArea);
    mapObj.map.once('draw.create', updateArea);
    mapObj.draw.changeMode('draw_polygon');
  };

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: uploadFile,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div {...getRootProps()}>
      <h3 className="f3 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
        <FormattedMessage {...messages.step1} />
      </h3>
      <div className="pb4">
        <p>
          <FormattedMessage {...messages.defineAreaDescription} />
        </p>
        <Button className="bg-blue-dark white mr2" onClick={drawHandler}>
          <FormattedMessage {...messages.draw} />
        </Button>
        <input {...getInputProps()} />
        <Button className="bg-blue-dark white" onClick={open}>
          <FormattedMessage {...messages.selectFile} />
        </Button>
        <p>
          <FormattedMessage {...messages.importDescription} />
        </p>
      </div>

      <div className="pb2">
        {containsMultiplePolygons && (
          <SwitchToggle
            label={<FormattedMessage {...messages.arbitraryTasks} />}
            labelPosition="right"
            isChecked={metadata.arbitraryTasks}
            onChange={() =>
              updateMetadata({ ...metadata, arbitraryTasks: !metadata.arbitraryTasks })
            }
          />
        )}
      </div>
      {metadata.geom && (
        <div className="pv3">
          <Button className="bg-white blue-dark" onClick={deleteHandler}>
            <UndoIcon className="w1 h1 mr2 v-mid pb1" />
            <FormattedMessage {...messages.reset} />
          </Button>
        </div>
      )}
    </div>
  );
}
