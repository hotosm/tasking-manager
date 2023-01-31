import React from 'react';
import { Link } from '@reach/router';

export const TopNavLink = (props) => {
  const { isActive, ...otherProps } = props;
  return (
    <Link getProps={isActive} {...otherProps}>
      {props.children}
    </Link>
  );
};
