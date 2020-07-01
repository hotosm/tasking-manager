import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Field } from 'react-final-form';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { formatCountryList } from '../utils/countries';
import { fetchLocalJSONAPI } from '../network/genericJSONRequest';

export const RadioField = ({ name, value, className }: Object) => (
  <Field
    name={name}
    component="input"
    type="radio"
    value={value}
    className={`radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light ${
      className || ''
    }`}
  />
);

export const SwitchToggle = ({ label, isChecked, onChange, labelPosition }: Object) => (
  <div className="v-mid justify-center bg-grey-dark">
    {label && labelPosition !== 'right' && <span className="di mr2 nowrap f6 dn-m">{label}</span>}
    <div className="relative dib">
      <input
        className="absolute z-5 w-100 h-100 o-0 pointer checkbox"
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
      />
      <div className="relative z-1 dib w3 h2 bg-blue-grey overflow-hidden br4 v-mid bg-animate checkbox-wrapper">
        <div className="absolute right-auto left-0 w2 h2 br4 bg-white ba b-grey-light shadow-4 t-cb bg-animate checkbox-toggle"></div>
      </div>
    </div>
    {label && labelPosition === 'right' && <span className="di ml2 f6">{label}</span>}
  </div>
);

export function OrganisationSelect({ className }: Object) {
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const token = useSelector((state) => state.auth.get('token'));
  const [organisations, setOrganisations] = useState([]);

  useEffect(() => {
    if (token && userDetails && userDetails.id) {
      const query = userDetails.role === 'ADMIN' ? '' : `&manager_user_id=${userDetails.id}`;
      fetchLocalJSONAPI(`organisations/?omitManagerList=true${query}`, token)
        .then((result) => setOrganisations(result.organisations))
        .catch((e) => console.log(e));
    }
  }, [userDetails, token]);
  const getOrgPlaceholder = (id) => {
    const orgs = organisations.filter((org) => org.organisationId === id);
    return orgs.length ? orgs[0].name : <FormattedMessage {...messages.selectOrganisation} />;
  };
  return (
    <Field name="organisation_id" className={className} required>
      {(props) => (
        <Select
          classNamePrefix="react-select"
          isClearable={false}
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => option.organisationId}
          options={organisations}
          placeholder={getOrgPlaceholder(props.input.value)}
          onChange={(value) => props.input.onChange(value.organisationId || '')}
          className="z-5"
        />
      )}
    </Field>
  );
}

export function UserCountrySelect({ className }: Object) {
  const locale = useSelector((state) => state.preferences.locale);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (locale) {
      setOptions(formatCountryList(locale));
    }
  }, [locale]);

  const getPlaceholder = (value) => {
    const placeholder = options.filter((option) => option.value === value);
    if (placeholder.length) {
      return placeholder[0].label;
    }
    return '';
  };

  return (
    <Field name="country" className={className}>
      {(props) => (
        <Select
          classNamePrefix="react-select"
          isClearable={false}
          options={options}
          placeholder={
            getPlaceholder(props.input.value) || <FormattedMessage {...messages.country} />
          }
          onChange={(value) => props.input.onChange(value.value)}
          className="z-5"
        />
      )}
    </Field>
  );
}
