import React from 'react';
import { Link } from '@reach/router';

import { LoadingIcon } from './svgIcons';

export function Button({ onClick, children, className, disabled, loading = false }: Object) {
  return (
    <button
      onClick={onClick}
      aria-pressed="false"
      focusindex="0"
      className={`${className || ''} br1 f5 bn ${disabled || loading ? 'o-50' : 'pointer'}`}
      style={{ padding: '.75rem 1.5rem' }}
      disabled={disabled || loading}
    >
      {loading && (
        <LoadingIcon className="h1 w1 v-mid mr2" style={{ animation: 'spin 1s linear infinite' }} />
      )}
      {children}
    </button>
  );
}

export function FormSubmitButton({
  children,
  className,
  disabledClassName,
  disabled,
  loading = false,
}: Object) {
  return (
    <button
      type="submit"
      aria-pressed="false"
      focusindex="0"
      className={`${disabled ? disabledClassName : className} br1 f5 bn ${
        disabled || loading ? '' : 'pointer'
      }`}
      style={{ padding: '.75rem 2.5rem' }}
      disabled={disabled || loading}
    >
      {loading && (
        <LoadingIcon className="h1 w1 v-mid mr2" style={{ animation: 'spin 1s linear infinite' }} />
      )}
      {children}
    </button>
  );
}

export function CustomButton({ onClick, children, className, disabled, loading = false }: Object) {
  return (
    <button
      onClick={onClick}
      aria-pressed="false"
      focusindex="0"
      className={`${className || ''} br1 f5 ${disabled || loading ? 'o-50' : 'pointer'}`}
      disabled={disabled || loading}
    >
      {loading && (
        <LoadingIcon className="h1 w1 v-mid mr2" style={{ animation: 'spin 1s linear infinite' }} />
      )}
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
