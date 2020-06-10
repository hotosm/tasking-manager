import React, { useContext, useState, useLayoutEffect } from 'react';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

export const ImageryForm = () => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const [licenses, setLicenses] = useState(null);

  useLayoutEffect(() => {
    const fetchLicenses = async () => {
      fetchLocalJSONAPI('licenses/')
        .then((res) => setLicenses(res.licenses))
        .catch((e) => console.log(e));
    };
    fetchLicenses();
  }, [setLicenses]);

  const handleChange = (event) => {
    setProjectInfo({ ...projectInfo, [event.target.name]: event.target.value });
  };

  let defaultValue = null;
  if (licenses !== null && projectInfo.licenseId !== null) {
    defaultValue = licenses.filter((l) => l.licenseId === projectInfo.licenseId)[0];
    //defaultValue = { name: license.name, value: license.licenseId };
  }

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.imageryURL} />
        </label>
        <input
          className={styleClasses.inputClass}
          onChange={handleChange}
          type="text"
          name="imagery"
          value={projectInfo.imagery}
        />
        <p className={styleClasses.pClass}>
          <FormattedMessage
            {...messages.imageryURLNote}
            values={{
              exampleUrl:
                'tms[22]:http://hiu-maps.net/hot/1.0.0/kathmandu_flipped/{zoom}/{x}/{y}.png',
            }}
          />
        </p>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.license} />
        </label>
        <Select
          classNamePrefix="react-select"
          isClearable={true}
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => option.licenseId}
          value={defaultValue}
          options={licenses}
          placeholder={<FormattedMessage {...messages.selectLicense} />}
          onChange={(l) => {
            let licenseId = null;
            if (l !== null) {
              licenseId = l.licenseId;
            }
            setProjectInfo((p) => {
              return { ...p, licenseId: licenseId };
            });
          }}
          className="w-50 z-5"
        />
      </div>
    </div>
  );
};
