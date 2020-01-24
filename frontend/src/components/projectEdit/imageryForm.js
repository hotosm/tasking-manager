import React, { useContext, useState, useLayoutEffect } from 'react';

import { StateContext, styleClasses } from '../../views/projectEdit';
import { API_URL } from '../../config';

export const ImageryForm = () => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const [licenses, setLicenses] = useState([{ licenseId: 0, name: 'no-license' }]);

  useLayoutEffect(() => {
    const fetchLicenses = async () => {
      const res = await fetch(`${API_URL}licenses/`);
      if (res.status === 200) {
        const licenses_json = res.json();
        setLicenses(l => l.concat(licenses_json.licenses));
      }
    };
    fetchLicenses();
  }, [setLicenses]);

  const handleLicense = e => {
    let licenseId = undefined;
    if (e.target.value !== '0') {
      licenseId = e.target.value;
    }
    setProjectInfo({ ...projectInfo, licenseId: licenseId });
  };

  const handleChange = event => {
    setProjectInfo({ ...projectInfo, [event.target.name]: event.target.value });
  };

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>URL to service</label>
        <input
          className={styleClasses.inputClass}
          onChange={handleChange}
          type="text"
          name="imagery"
          value={projectInfo.imagery}
        />
        <p className={styleClasses.pClass}>
          Note: follow this format for TMS URLs:
          tms[22]:http://hiu-maps.net/hot/1.0.0/kathmandu_flipped/{'{zoom}'}/{'{x}'}/{'{y}'}.png
        </p>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Required license</label>
        <select name="LicenseId" onChange={handleLicense} className="pa2">
          {licenses.map(l => (
            <option key={l.licenseId} value={l.licenseId}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
