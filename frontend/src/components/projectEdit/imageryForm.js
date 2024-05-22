import { useContext, useState, useLayoutEffect } from 'react';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { Code } from '../code';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { useImageryOption, IMAGERY_OPTIONS } from '../../hooks/UseImageryOption';

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

  let defaultValue = null;
  if (licenses !== null && projectInfo.licenseId !== null) {
    defaultValue = licenses.filter((l) => l.licenseId === projectInfo.licenseId)[0];
  }

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.imagery} />
        </label>
        <ImageryField imagery={projectInfo.imagery} setProjectInfo={setProjectInfo} />
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
            if (l !== null) licenseId = l.licenseId;
            setProjectInfo((p) => ({ ...p, licenseId: licenseId }));
          }}
          className="w-50 z-1"
        />
      </div>
    </div>
  );
};

const ImageryField = ({ imagery, setProjectInfo }) => {
  const imageryValue = useImageryOption(imagery);
  const [showInputField, setShowInputField] = useState(
    imageryValue && imageryValue.value === 'custom' ? true : false,
  );

  const onInputChange = (e) => setProjectInfo((p) => ({ ...p, imagery: e.target.value }));

  const onSelectChange = (option) => {
    if (option) {
      if (option.value === 'custom') {
        setShowInputField(true);
        setProjectInfo((p) => ({ ...p, imagery: 'https://...' }));
      } else {
        setShowInputField(false);
        setProjectInfo((p) => ({ ...p, imagery: option.value }));
      }
    } else {
      setShowInputField(false);
      setProjectInfo((p) => ({ ...p, imagery: null }));
    }
  };

  const exampleUrl = 'tms[22]:https://hiu-maps.net/hot/1.0.0/kathmandu_flipped/{zoom}/{x}/{y}.png';

  return (
    <>
      <Select
        classNamePrefix="react-select"
        isClearable={true}
        value={imageryValue}
        options={IMAGERY_OPTIONS}
        placeholder={<FormattedMessage {...messages.selectImagery} />}
        onChange={onSelectChange}
        className="w-50 z-2"
      />
      {showInputField && (
        <>
          <input
            className={styleClasses.inputClass}
            onChange={onInputChange}
            type="text"
            name="imagery"
            value={imagery}
          />
          <p className={styleClasses.pClass}>
            <FormattedMessage
              {...messages.imageryURLNote}
              values={{
                exampleUrl: (
                  <span className="db">
                    <Code>{exampleUrl}</Code>
                  </span>
                ),
              }}
            />
          </p>
        </>
      )}
    </>
  );
};
