import React, { useEffect, useState} from 'react';
import { useSelector } from 'react-redux';
import { Field } from 'react-final-form';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { fetchLocalJSONAPI } from '../network/genericJSONRequest';

export const RadioField = ({ name, value, className }: Object) => (
  <Field
    name={name}
    component="input"
    type="radio"
    value={value}
    className={`radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light ${className || ''}`}
  />
);

export const SwitchToggle = ({ label, isChecked, onChange, labelPosition }: Object) => (
  <div className="flex items-center justify-center bg-grey-dark">
    {label && labelPosition !== 'right' && <span className="di mr2 nowrap f6 dn-m">{label}</span>}
    <div className="relative dib">
      <input
        className="absolute z-5 w-100 h-100 o-0 pointer checkbox"
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
      />
      <div className="relative z-4 dib w3 h2 bg-blue-grey overflow-hidden br4 v-mid bg-animate checkbox-wrapper">
        <div className="absolute right-auto left-0 w2 h2 br4 bg-white ba b-grey-light shadow-4 t-cb bg-animate checkbox-toggle"></div>
      </div>
    </div>
    {label && labelPosition === 'right' && <span className="di ml2 f6">{label}</span>}
  </div>
);

export function OrganisationSelect({ className }: Object) {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const [organisations, setOrganisations] = useState([]);
  useEffect(
    () => {
      if (userDetails && userDetails.id) {
        const query = userDetails.role === 'ADMIN' ? '' : `?manager_user_id=${userDetails.id}`;
        fetchLocalJSONAPI(`organisations/${query}`).then(
          result => setOrganisations(result.organisations)
        ).catch(e => console.log(e));
      }
    }, [userDetails]
  );
  return(
    <Field name="organisation" className={className} required>
      {props => (
        <Select
          isClearable={false}
          getOptionLabel={option => option.name}
          getOptionValue={option => option.organisationId}
          options={organisations}
          placeholder={props.input.value || <FormattedMessage {...messages.selectOrganisation}/>}
          onChange={value => props.input.onChange(value.organisationId || '')}
          className="z-5"
        />
      )}
    </Field>
  );
}
