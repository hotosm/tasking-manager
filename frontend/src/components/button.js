import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export function Button({ onClick, children, className, icon }: Object) {
  return (
    <button
      onClick={onClick}
      className={`${className || ''} btn`}
    >
      {children}
      {icon && <FontAwesomeIcon icon={icon} />}
    </button>
  );
}
