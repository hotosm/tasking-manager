import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import typesMessages from '../messages';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { CheckBox } from '../formInputs';
import { ProjectInterests } from './projectInterests';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { ID_PRESETS } from '../../config/presets';

export const MetadataForm = () => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const [interests, setInterests] = useState([]);
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const token = useSelector((state) => state.auth.get('token'));
  const [organisations, setOrganisations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    if (userDetails && userDetails.id) {
      const query = userDetails.role === 'ADMIN' ? '' : `&manager_user_id=${userDetails.id}`;
      fetchLocalJSONAPI(`organisations/?omitManagerList=true${query}`, token)
        .then((result) => setOrganisations(result.organisations))
        .catch((e) => console.log(e));
    }

    fetchLocalJSONAPI('campaigns/')
      .then((res) => setCampaigns(res.campaigns))
      .catch((e) => console.log(e));
  }, [userDetails, token]);

  const elements = [
    { item: 'ROADS', messageId: 'roads' },
    { item: 'BUILDINGS', messageId: 'buildings' },
    { item: 'WATERWAYS', messageId: 'waterways' },
    { item: 'LAND_USE', messageId: 'landUse' },
    { item: 'OTHER', messageId: 'other' },
  ];

  const mapperLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  const handleMappingTypes = (types) => {
    setProjectInfo({ ...projectInfo, mappingTypes: types });
  };

  useEffect(() => {
    if (interests.length === 0) {
      fetchLocalJSONAPI('interests/').then((res) => {
        setInterests(res.interests);
      });
    }
  }, [interests.length]);

  // Get id presets members:
  let idPresetsValue = [];
  const presets = Object.keys(ID_PRESETS).map((p) => {
    const categoryLabel = ID_PRESETS[p].name;

    const opts = ID_PRESETS[p].members.map((l) => {
      const obj = { label: l, value: l };

      if (projectInfo.idPresets && projectInfo.idPresets.includes(l) === true) {
        idPresetsValue.push(obj);
      }
      return obj;
    });

    return { label: categoryLabel, options: opts };
  });

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.mapperLevel} />
        </label>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.mapperLevelDescription} />
        </p>
        {mapperLevels.map((level) => (
          <label className="dib pr5" key={level}>
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
      <div className={styleClasses.divClass + ' cf'}>
        <div className="w-50 fl">
          <label className={styleClasses.labelClass}>
            <FormattedMessage {...messages.mappingTypes} />*
          </label>
          {elements.map((elm) => (
            <div className="pv3 pr3" aria-label="mapping_types" key={elm.messageId}>
              <div className="ph0 pt1 fl" aria-labelledby={elm.messageId}>
                <CheckBox
                  activeItems={projectInfo.mappingTypes}
                  toggleFn={handleMappingTypes}
                  itemId={elm.item}
                />
              </div>
              <span className="fl pt2 mr1 ph2" id={elm.messageId}>
                <FormattedMessage {...typesMessages[elm.messageId]} />
              </span>
            </div>
          ))}
        </div>
        <div className="w-50 fl">
          <label className={styleClasses.labelClass}>
            <FormattedMessage {...messages.idPresets} />
          </label>
          <Select
            classNamePrefix="react-select"
            isClearable={true}
            isMulti={true}
            options={presets}
            className="z-9999"
            onChange={(val) => {
              if (val === null) {
                setProjectInfo((p) => {
                  return { ...p, idPresets: [] };
                });

                return;
              }
              const values = val.map((v) => v.value);
              setProjectInfo((p) => {
                return { ...p, idPresets: values };
              });
            }}
            defaultValue={idPresetsValue}
          />
        </div>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.organisation} />
        </label>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.organisationDescription} />
        </p>
        <Select
          classNamePrefix="react-select"
          isClearable={false}
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => option.organisationId}
          options={organisations}
          defaultValue={
            projectInfo.organisation && {
              name: projectInfo.organisationName,
              value: projectInfo.organisation,
            }
          }
          placeholder={<FormattedMessage {...messages.selectOrganisation} />}
          onChange={(value) =>
            setProjectInfo({ ...projectInfo, organisation: value.organisationId || '' })
          }
          className="z-5"
        />
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.campaign} />
        </label>
        <Select
          classNamePrefix="react-select"
          isClearable={false}
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => option.id}
          isMulti={true}
          options={campaigns}
          placeholder={<FormattedMessage {...messages.selectCampaign} />}
          className="z-4"
          defaultValue={projectInfo.campaigns}
          isSearchable={true}
          onChange={(value) => setProjectInfo({ ...projectInfo, campaigns: value })}
        />
      </div>

      <div className={styleClasses.divClass.replace('w-70', 'w-80')}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.categories} />
        </label>
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
