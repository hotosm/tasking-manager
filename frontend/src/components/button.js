import React from 'react';
import { Link } from '@reach/router';

export function Button({ onClick, children, className, disabled }: Object) {
  return (
    <button
      onClick={onClick}
      aria-pressed="false"
      focusindex="0"
      className={`${className || ''} br1 f5 bn ${disabled ? 'o-50' : 'pointer'}`}
      style={{ padding: '.75rem 1.5rem' }}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function FormSubmitButton({ children, className, disabledClassName, disabled }: Object) {
  return (
    <button
      type="submit"
      aria-pressed="false"
      focusindex="0"
      className={`${disabled ? disabledClassName : className} br1 f5 bn ${
        disabled ? '' : 'pointer'
      }`}
      style={{ padding: '.75rem 2.5rem' }}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function CustomButton({ onClick, children, className }: Object) {
  return (
    <button
      onClick={onClick}
      aria-pressed="false"
      focusindex="0"
      className={`${className || ''} br1 f5 pointer`}
    >
      {children}
    </button>
  );
}

export function EditButton({ url, children }: Object) {
  return (
    <Link
      to={url}
      className="pointer no-underline br1 fw6 f7 dib pv2 ph3 ba b--red white bg-red mh1 mv1"
    >
      {children}
    </Link>
  );
}
