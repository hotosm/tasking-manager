import React from 'react';

export function Button({ onClick, children, className }: Object) {
  return (
    <button
      onClick={onClick}
      aria-pressed="false"
      focusindex="0"
      className={`${className || ''} br1 f5 bn pointer`}
      style={{ padding: '.75rem 1.5rem' }}
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
