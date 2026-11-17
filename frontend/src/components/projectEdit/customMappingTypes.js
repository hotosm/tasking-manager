import { FormattedMessage, useIntl } from 'react-intl';
import CreatableSelect from 'react-select/creatable';

import messages from './messages';
import { styleClasses } from '../../views/projectEdit';
import { CustomButton } from '../button';
import { PlusIcon, WasteIcon } from '../svgIcons';

export const CUSTOM_MAPPING_TYPES_LIMIT = 10;
// Mirrors the backend validation, since tags and keys end up in the export queries.
const OSM_KEY = '[A-Za-z0-9_:.-]+';
const TAG_PATTERN = new RegExp(`^${OSM_KEY}=[^$]+$`);
const KEY_PATTERN = new RegExp(`^${OSM_KEY}$`);

const toOptions = (values) => values.map((value) => ({ label: value, value }));

const TagsInput = ({ values, pattern, placeholder, onChange, ariaLabel }) => (
  <CreatableSelect
    classNamePrefix="react-select"
    className="w-80 mb2"
    aria-label={ariaLabel}
    isMulti
    isClearable
    components={{ DropdownIndicator: null }}
    value={toOptions(values)}
    placeholder={placeholder}
    isValidNewOption={(input) => pattern.test(input.trim())}
    noOptionsMessage={() => <FormattedMessage {...messages.customMappingTypeInvalidInput} />}
    onCreateOption={(input) => onChange([...values, input.trim()])}
    onChange={(selected) => onChange((selected || []).map((option) => option.value))}
  />
);

export const CustomMappingTypes = ({ customMappingTypes = [], setProjectInfo }) => {
  const intl = useIntl();

  const updateType = (index, changes) =>
    setProjectInfo((p) => ({
      ...p,
      customMappingTypes: p.customMappingTypes.map((customType, i) =>
        i === index ? { ...customType, ...changes } : customType,
      ),
    }));

  const addType = () =>
    setProjectInfo((p) => ({
      ...p,
      customMappingTypes: [...(p.customMappingTypes || []), { name: '', tags: [], attributes: [] }],
    }));

  const removeType = (index) =>
    setProjectInfo((p) => ({
      ...p,
      customMappingTypes: p.customMappingTypes.filter((_, i) => i !== index),
    }));

  return (
    <div className={styleClasses.divClass}>
      <label className={styleClasses.labelClass}>
        <FormattedMessage {...messages.customMappingTypes} />
      </label>
      <p className={styleClasses.pClass}>
        <FormattedMessage {...messages.customMappingTypesDescription} />
      </p>
      {customMappingTypes.map((customType, index) => (
        <div className="ba b--grey-light pa3 mb3" key={index}>
          <label className="db fw6 mb2" htmlFor={`customMappingTypeName${index}`}>
            <FormattedMessage {...messages.customMappingTypeName} />
          </label>
          <input
            id={`customMappingTypeName${index}`}
            className={styleClasses.inputClass}
            type="text"
            maxLength={50}
            value={customType.name}
            onChange={(e) => updateType(index, { name: e.target.value })}
          />
          <label className="db fw6 mt3 mb2">
            <FormattedMessage {...messages.customMappingTypeTags} />
          </label>
          <TagsInput
            ariaLabel={intl.formatMessage(messages.customMappingTypeTags)}
            values={customType.tags}
            pattern={TAG_PATTERN}
            placeholder={intl.formatMessage(messages.customMappingTypeTagsPlaceholder)}
            onChange={(tags) => updateType(index, { tags })}
          />
          <label className="db fw6 mt3 mb2">
            <FormattedMessage {...messages.customMappingTypeAttributes} />
          </label>
          <TagsInput
            ariaLabel={intl.formatMessage(messages.customMappingTypeAttributes)}
            values={customType.attributes || []}
            pattern={KEY_PATTERN}
            placeholder={intl.formatMessage(messages.customMappingTypeAttributesPlaceholder)}
            onChange={(attributes) => updateType(index, { attributes })}
          />
          <CustomButton
            className="red bg-white pv2 ph3 ba b--red"
            onClick={() => removeType(index)}
          >
            <WasteIcon className="pr2 v-top" />
            <FormattedMessage {...messages.removeCustomMappingType} />
          </CustomButton>
        </div>
      ))}
      <CustomButton
        className="bg-white blue-dark pv2 ph3 ba b--blue-dark"
        onClick={addType}
        disabled={customMappingTypes.length >= CUSTOM_MAPPING_TYPES_LIMIT}
      >
        <PlusIcon className="pr2 v-mid" height="14" />
        <FormattedMessage {...messages.addCustomMappingType} />
      </CustomButton>
    </div>
  );
};
