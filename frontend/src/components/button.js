import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export function Button({ onClick, children, className, icon }: Object) {
  return (
    <button
      onClick={onClick}
      aria-pressed="false"
      focusindex="0"
      className={`${className || ''} br1 f5 bn pointer`}
      style={{padding: ".75rem 1.5rem"}}
    >
      {icon ? <span className="fl">{ children }</span> : children}
      {icon && <FontAwesomeIcon icon={icon} className="ml2 txt-s fr"/>}
    </button>
  );
}
