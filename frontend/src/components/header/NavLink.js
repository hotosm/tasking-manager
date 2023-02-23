import React from 'react';
import { Link, useMatch } from 'react-router-dom';

export const TopNavLink = (props) => {
  const { isActive, ...otherProps } = props;
  const linkCombo = 'link mh3 barlow-condensed blue-dark f4 ttu lh-solid nowrap pv2';
  let match = useMatch(props.to + '/*');

  return (
    <Link className={match ? `${linkCombo} bb b--blue-dark bw1` : linkCombo} {...otherProps}>
      {props.children}
    </Link>
  );
};
