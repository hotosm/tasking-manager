import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import messages from '../../components/messages.js';
import { injectIntl } from 'react-intl';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

const Contributions = props => {
  const layerName = 'highlight-tasks';
  const mappingLevels = [
    { value: 'ALL', label: props.intl.formatMessage(messages.mappingLevelALL) },
    { value: 'ADVANCED', label: props.intl.formatMessage(messages.mappingLevelADVANCED) },
    { value: 'INTERMEDIATE', label: props.intl.formatMessage(messages.mappingLevelINTERMEDIATE) },
    { value: 'BEGINNER', label: props.intl.formatMessage(messages.mappingLevelBEGINNER) },
  ];

  useEffect(() => {
    fetchLocalJSONAPI(`projects/${props.projectId}/contributions/`).then(v => setContribs(v));
  }, [props.projectId]);

  const [level, setLevel] = useState(mappingLevels[0]);
  const [contribs, setContribs] = useState(null);

  const removeLayer = layerName => {
    if (props.map === null) {
      return;
    }

    if (props.map.getLayer(layerName)) {
      props.map.removeLayer(layerName);
    }
    if (props.map.getSource(layerName)) {
      props.map.removeSource(layerName);
    }
  };

  const MappingLevelSelect = () => {
    return (
      <Select
        isClearable={false}
        options={mappingLevels}
        onChange={value => setLevel(value)}
        className="w-30 fr"
        value={level}
      />
    );
  };

  const displayTasks = taskIds => {
    if (!props.tasks.features || props.map === null || props.map.isStyleLoaded() === false) {
      return null;
    }

    removeLayer(layerName);
    let features = props.tasks.features.filter(t => taskIds.includes(t.properties.taskId));
    features = features.map(f => {
      return { ...f, type: 'LineString' };
    });

    const geojson = {
      type: 'FeatureCollection',
      features: features,
    };

    const source = {
      type: 'geojson',
      data: geojson,
    };
    const paintOptions = {
      'line-width': 2,
      'line-color': '#2c3038',
    };

    const jsonData = {
      id: layerName,
      type: 'line',
      source: source,
      layout: {},
      paint: paintOptions,
    };

    props.map.addLayer(jsonData);
  };

  const avatarClass = 'h2 w2 br-100 pa1 ';

  if (contribs === null) {
    return null;
  }

  let contributionsArray = contribs.userContributions;
  if (level.value !== 'ALL') {
    contributionsArray = contributionsArray.filter(u => u.mappingLevel === level.value);
  }

  return (
    <div className="w-100 f6 pr4 cf">
      <MappingLevelSelect />
      {contributionsArray.map(u => {
        return (
          <div
            onMouseEnter={() => displayTasks(u.taskIds)}
            onMouseLeave={() => removeLayer(layerName)}
            className="dim w-100 flex justify-between pa3 ba b--tan mb2 items-center"
          >
            {u.pictureUrl !== null ? (
              <img className={avatarClass} src={u.pictureUrl} alt={u.username} />
            ) : (
              <div className="h2 w2 bg-light-gray ma1 br-100"></div>
            )}
            <div className="w-25">
              {' '}
              <a
                className="blue-dark mr2"
                rel="noopener noreferrer"
                target="_blank"
                href={`/users/${u.username}`}
              >
                {u.username}
              </a>{' '}
              <div className="b f7">{u.mappingLevel}</div>
            </div>
            <div style={{ width: '12%' }} className="flex justify-between">
              <span className="mr1 b self-start">{u.mapped}</span>
              <span>mapped</span>
            </div>
            <div style={{ width: '12%' }} className="flex justify-between">
              <span className="mr1 b">{u.validated}</span>
              <span>validated</span>
            </div>
            <div style={{ width: '9%' }} className="flex justify-between">
              <span className="mr1 b">{u.total}</span>
              <span>total</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default injectIntl(Contributions);
