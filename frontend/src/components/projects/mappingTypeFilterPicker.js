import React from 'react';
import { useIntl } from 'react-intl';

import messages from '../messages';
import { TITLED_ICONS } from '../mappingTypes';

export const MappingTypeFilterPicker = (props) => {
  const intl = useIntl();
  const pagerStyle = 'link br1 h2 w2 pa1 ma1 ba b--white bw1 dib pointer';
  const checkboxStyle = 'absolute o-0 z-5 w-100 h-100 pointer input-reset checkbox';
  const activeStyle = 'blue-dark';
  const inactiveStyle = 'pb1 grey-light';

  const handleMappingTypeInputChange = (event) => {
    const target = event.target;
    const value = target.getAttribute('value');
    const otherTypes = props.mappingTypes ? props.mappingTypes.filter((n) => n !== value) : [];
    const toggledType =
      props.mappingTypes && props.mappingTypes.find((n) => n === value) ? [] : [value];
    props.setMappingTypesQuery(otherTypes.concat(toggledType), 'pushIn');
  };

  return (
    <div className="mv2 base-font">
      {TITLED_ICONS.map((EachIcon, key) => {
        const isActive = props.mappingTypes
          ? props.mappingTypes.find((n) => n === EachIcon.value)
          : false;
        const highlight = isActive ? activeStyle : inactiveStyle;
        return (
          <label
            title={intl.formatMessage(messages[EachIcon.title])}
            key={'lblmtp' + key}
            className="relative"
          >
            <input
              name="types"
              value={EachIcon.value}
              onChange={handleMappingTypeInputChange}
              className={checkboxStyle}
              defaultChecked={isActive}
              type="checkbox"
              key={'chkmtp' + key}
            />

            <EachIcon.Icon
              title={EachIcon.title}
              className={`${pagerStyle} ${highlight}`}
              key={key}
            />
          </label>
        );
      })}
    </div>
  );
};
