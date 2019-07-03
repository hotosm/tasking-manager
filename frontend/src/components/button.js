import React from 'react';


export function Button({ onClick, children, className }: Object) {
  return (
    <button
      onClick={onClick}
      aria-pressed="false"
      focusindex="0"
      className={`${className || ''} br1 f5 bn pointer`}
      style={{padding: ".75rem 1.5rem"}}
    >
      { children }
    </button>
  );
}
