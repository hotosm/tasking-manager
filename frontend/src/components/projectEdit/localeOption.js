import React from 'react';

export const LocaleOption = ({ localeCode, name, isActive, hasValue, onClick }) => {
  const additionalClasses = isActive
    ? 'bg-blue-grey fw6 white'
    : hasValue
    ? 'bg-white fw6 blue-dark'
    : 'bg-white blue-grey';
  return (
    <li
      onClick={() => onClick(localeCode)}
      className={`${additionalClasses} ba b--grey-light br1 ph2 mb2 pv1 f7 mr2 pointer`}
      title={name}
    >
      {localeCode}
    </li>
  );
};
