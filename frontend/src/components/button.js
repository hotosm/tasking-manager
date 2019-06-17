import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export function Button({ onClick, children, className, icon }: Object) {
  return (
    <button
      onClick={onClick}
      className={`${className || ''} btn wmin96`}
    >
      {icon ? <span className="pull-left">{ children }</span> : children}
      {icon && <FontAwesomeIcon icon={icon} className="ml18 txt-s pull-right"/>}
    </button>
  );
}
