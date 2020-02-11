import React, { useContext, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { StateContext, styleClasses, handleCheckButton } from '../../views/projectEdit';
import { ProjectInterests } from './projectInterests';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

export const MetadataForm = () => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const [interests, setInterests] = useState([]);

  const elements = [
    { item: 'ROADS', showItem: 'Roads' },
    { item: 'BUILDINGS', showItem: 'Buildings' },
    { item: 'WATERWAYS', showItem: 'Waterways' },
    { item: 'LANDUSE', showItem: 'Landuse' },
    { item: 'OTHER', showItem: 'Other' },
  ];

  const mapperLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  const handleMappingTypes = event => {
    let types = projectInfo.mappingTypes;

    types = handleCheckButton(event, types);
    setProjectInfo({ ...projectInfo, mappingTypes: types });
  };

  useEffect(() => {
    if (interests.length === 0) {
      fetchLocalJSONAPI('interests/').then(res => {
        setInterests(res.interests);
      });
    }
  }, [interests.length]);

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.mapperLevel} />
        </label>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.mapperLevelDescription} />
        </p>
        {mapperLevels.map(level => (
          <label className="db pv2" key={level}>
            <input
              value={level}
              checked={projectInfo.mapperLevel === level}
              onChange={() =>
                setProjectInfo({
                  ...projectInfo,
                  mapperLevel: level,
                })
              }
              type="radio"
              className={`radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light`}
            />
            <FormattedMessage {...messages[`mapperLevel${level}`]} />
          </label>
        ))}
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.mappingTypes} />*
        </label>
        {elements.map(elm => (
          <label className="db pv2">
            <input
              className="mr2 h"
              name="mapping_types"
              checked={projectInfo.mappingTypes.includes(elm.item)}
              onChange={handleMappingTypes}
              type="checkbox"
              value={elm.item}
            />
            {elm.showItem}
          </label>
        ))}
      </div>
      <div className={styleClasses.divClass.replace('w-70', 'w-80')}>
        <label className={styleClasses.labelClass}>Interests</label>
        <ProjectInterests
          interests={interests}
          projectInterests={projectInfo.interests}
          setProjectInfo={setProjectInfo}
          setInterests={setInterests}
        />
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.osmchaFilterId} />
        </label>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.osmchaFilterIdDescription} />
        </p>
        <input
          className={styleClasses.inputClass}
          type="text"
          name="osmchaFilterId"
          value={projectInfo.osmchaFilterId}
        />
      </div>
    </div>
  );
};
