import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Field } from 'react-final-form';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { formatCountryList } from '../utils/countries';
import { fetchLocalJSONAPI } from '../network/genericJSONRequest';
import { CheckIcon, SearchIcon, CloseIcon } from './svgIcons';
import { RootStore } from '../store';

export const RadioField = ({
  name,
  value,
  className,
  required = false,
}: {
  name: string;
  value: string;
  className?: string;
  required?: boolean;
}) => (
  <Field
    name={name}
    component="input"
    type="radio"
    value={value}
    className={`radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light ${
      className || ''
    }`}
    required={required}
  />
);

export const SwitchToggle = ({
  label,
  isChecked,
  onChange,
  labelPosition,
  small = false,
  isDisabled = false,
}: {
  label: string;
  isChecked: boolean;
  onChange: () => void;
  labelPosition: string;
  small?: boolean;
  isDisabled?: boolean;
}) => (
  <div className="v-mid justify-center">
    {label && labelPosition !== 'right' && <span className="di mr2 nowrap f6 dn-m">{label}</span>}
    <div className="relative dib">
      <input
        className={`absolute z-5 w-100 h-100 o-0 ${!isDisabled ? 'pointer' : ''} checkbox`}
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        disabled={isDisabled}
      />
      <div
        className={`relative z-1 dib ${
          isDisabled ? 'bg-moon-gray' : 'bg-blue-light'
        } overflow-hidden br4 v-mid bg-animate checkbox-wrapper switch-ctr`}
      >
        <div className="absolute switch-thumb br4 bg-white t-cb bg-animate checkbox-toggle" />
      </div>
    </div>
    {label && labelPosition === 'right' && <span className="di ml2 f6">{label}</span>}
  </div>
);

export const OrganisationSelect = ({
  className,
  orgId,
  onChange,
}: {
  className?: string;
  orgId: number | string;
  onChange: (value: number | string) => void;
}) => {
  const userDetails = useSelector((state: RootStore) => state.auth.userDetails);
  const token = useSelector((state: RootStore) => state.auth.token);
  const [organisations, setOrganisations] = useState([]);

  useEffect(() => {
    if (token && userDetails && userDetails.id) {
      const query = userDetails.role === 'ADMIN' ? '' : `&manager_user_id=${userDetails.id}`;
      fetchLocalJSONAPI(`organisations/?omitManagerList=true${query}`, token)
        .then((result) => setOrganisations(result.organisations))
        .catch((e) => console.log(e));
    }
  }, [userDetails, token]);

  const getOrgPlaceholder = (id: string | number) => {
    const orgs = organisations.filter((org) => org.organisationId === id);
    return orgs.length ? orgs[0].name : <FormattedMessage {...messages.selectOrganisation} />;
  };

  return (
    <Select
      classNamePrefix="react-select"
      isClearable={false}
      getOptionLabel={(option) => option.name}
      getOptionValue={(option) => option.organisationId}
      options={organisations}
      placeholder={getOrgPlaceholder(orgId)}
      onChange={onChange}
      className={className}
    />
  );
};

export function OrganisationSelectInput(props: {
  className?: string;
  input: { value: string; onChange: (value: string) => void };
}) {
  return (
    <Field name="organisation_id" className={props.className} required>
      <OrganisationSelect
        orgId={props.input.value}
        onChange={(value) => props.input.onChange(value.toString())}
        className="z-5"
      />
    </Field>
  );
}

export function UserCountrySelect({
  className,
  isDisabled = false,
}: {
  className?: string;
  isDisabled?: boolean;
}) {
  const locale = useSelector((state: RootStore) => state.preferences.locale);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (locale) {
      setOptions(formatCountryList(locale));
    }
  }, [locale]);

  const getPlaceholder = (value: string) => {
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
          isDisabled={isDisabled}
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

export const CheckBoxInput = ({
  isActive,
  changeState,
  className = '',
  disabled,
}: {
  isActive: boolean;
  changeState: () => void;
  className?: string;
  disabled?: boolean;
}) => (
  <div
    role="checkbox"
    disabled={disabled}
    aria-checked={isActive}
    onClick={disabled ? () => {} : changeState}
    onKeyPress={disabled ? () => {} : changeState}
    tabIndex={0}
    className={`bg-white w1 h1 ma1 ba bw1 ${
      disabled ? 'b--grey-light' : 'b--red'
    } br1 relative pointer ${className}`}
  >
    {isActive ? (
      <div
        className={`${disabled ? 'bg-grey-light' : 'bg-red'} ba b--white bw1 br1 w-100 h-100`}
      ></div>
    ) : (
      <></>
    )}
  </div>
);

export const CheckBox = ({
  activeItems,
  toggleFn,
  itemId,
}: {
  activeItems: any[];
  toggleFn: (value: any[]) => void;
  itemId: any;
}) => {
  const isActive = activeItems.includes(itemId);
  const changeState = (e) => {
    e.persist();
    e.preventDefault();
    e.stopPropagation();

    let copy = activeItems;
    if (copy.includes(itemId)) {
      copy = copy.filter((s) => s !== itemId);
    } else {
      copy = [...copy, itemId];
    }
    toggleFn(copy);
  };

  return <CheckBoxInput changeState={changeState} isActive={isActive} />;
};

export const SelectAll = ({ selected, setSelected, allItems, className }) => {
  const isActive = selected.length === allItems.length;
  const changeState = (e) => {
    e.preventDefault();
    if (isActive) {
      setSelected([]);
    } else {
      setSelected(allItems);
    }
  };

  return <CheckBoxInput changeState={changeState} isActive={isActive} className={className} />;
};

export const InterestsList = ({
  interests,
  field,
  changeSelect,
}: {
  interests: any[];
  field: string;
  changeSelect: (value: any) => void;
}) => (
  <div className="w-100 pa0 interest-cards-ctr">
    {interests.map((interest) => (
      <article
        key={interest.id}
        onClick={() => changeSelect(interest.id)}
        className={`${
          interest[field] === true ? 'b--red bw1 blue-dark' : 'b--grey-light blue-grey'
        } bg-white ba br1 tc relative ttc pointer text-break lh-base interest-card `}
      >
        {interest.name}
        {interest[field] === true && (
          <CheckIcon className="f7 pa1 br-100 bg-red white absolute right-0 top-0" />
        )}
      </article>
    ))}
  </div>
);

// Used as a generic search box for input fields in the management section
export const TextField = ({
  value,
  placeholderMsg,
  onChange,
  onCloseIconClick,
}: {
  value: string;
  placeholderMsg: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCloseIconClick: () => void;
}) => {
  const inputRef = useRef(null);

  return (
    <div className="db w-100">
      <FormattedMessage {...placeholderMsg}>
        {(msg) => {
          return (
            <form
              className="relative"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <div>
                <SearchIcon
                  onClick={() => inputRef.current.focus()}
                  className={`absolute ${!value ? 'blue-grey' : 'red'}`}
                  style={{ top: 11, left: 16 }}
                />
              </div>
              <input
                id="name"
                ref={inputRef}
                autoComplete="off"
                value={value}
                onChange={onChange}
                placeholder={msg}
                className={'input-reset ba b--card pa1 lh-title db w-100 f6 br1'}
                style={{ textIndent: '36px', height: '36px' }}
                type="text"
                aria-describedby="name-desc"
              />
              <CloseIcon
                onClick={onCloseIconClick}
                role="button"
                aria-label="clear"
                className={`absolute w1 h1 top-0 pt2 pointer pr2 right-0 red ${
                  !value ? 'pr2 right-0 dn ' : 'pr2 right-0'
                }`}
              />
            </form>
          );
        }}
      </FormattedMessage>
    </div>
  );
};
