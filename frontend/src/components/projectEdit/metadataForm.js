import React, { useContext, useState, useLayoutEffect } from 'react';

import { StateContext, styleClasses, handleCheckButton } from '../../views/projectEdit';
import { Button } from '../button';
import { API_URL } from '../../config';

export const MetadataForm = () => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const elements = [
    { item: 'ROADS', showItem: 'Roads' },
    { item: 'BUILDINGS', showItem: 'Buildings' },
    { item: 'WATERWAYS', showItem: 'Waterways' },
    { item: 'LAND_USE', showItem: 'Landuse' },
    { item: 'OTHER', showItem: 'Other' },
  ];

  const [orgs, setOrgs] = useState([{ organisationId: 0, name: '' }]);

  useLayoutEffect(() => {
    const fetchOrgs = async () => {
      const res = await fetch(`${API_URL}organisations/`);
      if (res.status === 200) {
        const orgs_json = await res.json();
        setOrgs(o => o.concat(orgs_json.organisations));
      }
    };
    fetchOrgs();
  }, [setOrgs]);

  const mapperLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  const handleMappingTypes = event => {
    let types = projectInfo.mappingTypes;

    types = handleCheckButton(event, types);
    setProjectInfo({ ...projectInfo, mappingTypes: types });
  };

  return (
    <div className="w-100">
      <p>
        Metadata and tags are used to allow users to find projects to work on and group projects.
      </p>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Mapper level</label>
        {mapperLevels.map(e => (
          <Button
            className={
              e === projectInfo.mapperLevel ? 'bg-blue-dark white mr2' : 'bg-white blue-dark mr2'
            }
            onClick={() => setProjectInfo({ ...projectInfo, mapperLevel: e })}
          >
            {e}
          </Button>
        ))}
        <p className={styleClasses.pClass}>
          Setting the level will help the mappers find suitable projects to work on. You can enforce
          the level required for mapping in the permissions section.
        </p>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Type(s) of mapping *</label>
        {elements.map(elm => (
          <label className="db pv2">
            <input
              className="mr2"
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
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Organisation</label>
        <p className={styleClasses.pClass}>Only one organisationis allowed.</p>
        <select
          name="LicenseId"
          className="pa2"
          onChange={e => setProjectInfo({ ...projectInfo, organisation: parseInt(e.target.value) })}
        >
          {orgs.map(o => (
            <option
              selected={projectInfo.organisation === o.organisationId ? true : false}
              value={o.organisationId}
            >
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>OSMCha Filter Id</label>
        <input
          className={styleClasses.inputClass}
          type="text"
          name="osmchaFilterId"
          value={projectInfo.osmchaFilterId}
        />
        <p className={styleClasses.pClass}>
          Optional id of a saved OSMCha filter to apply when viewing the project in OSMCha, if you
          desire custom filtering. Note that this replaces all standard filters. Example:
          095e8b31-b3cb-4b36-a106-02826fb6a109 (for convenience, you can also paste an OSMCha URL
          here that uses a saved filter and the filter id will be extracted for you).
        </p>
      </div>
    </div>
  );
};
