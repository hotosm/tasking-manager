import { Link } from 'react-router-dom';

import { LoadingIcon } from './svgIcons';
import React from 'react';

const IconSpace = ({ children }) => <span className="mr2">{children}</span>;
export const AnimatedLoadingIcon = () => (
  <IconSpace>
    <LoadingIcon className="h1 w1 v-mid" style={{ animation: 'spin 1s linear infinite' }} />
  </IconSpace>
);

export function Button({ onClick, children, icon, className, disabled, loading = false }: Object) {
  return (
    <button
      onClick={onClick}
      aria-pressed="false"
      focusindex="0"
      className={`${className || ''} br1 f5 bn ${disabled || loading ? 'o-50' : 'pointer'}`}
      style={{ padding: '.75rem 1.5rem' }}
      disabled={disabled || loading}
    >
      {loading ? <AnimatedLoadingIcon /> : icon && <IconSpace>{icon}</IconSpace>}
      {children}
    </button>
  );
}

export function FormSubmitButton({
  children,
  className,
  icon,
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
      {loading ? <AnimatedLoadingIcon /> : icon && <IconSpace>{icon}</IconSpace>}
      {children}
    </button>
  );
}

export const CustomButton = React.forwardRef(
  ({ onClick, children, icon, className, disabled, loading = false }, ref): Object => {
    return (
      <button
        onClick={onClick}
        ref={ref}
        aria-pressed="false"
        focusindex="0"
        className={`${className || ''} br1 f5 ${disabled || loading ? 'o-50' : 'pointer'}`}
        disabled={disabled || loading}
      >
        {loading ? <AnimatedLoadingIcon /> : icon && <IconSpace>{icon}</IconSpace>}
        {children}
      </button>
    );
  },
);

export function EditButton({ url, children, className = 'mh1 mv1' }: Object) {
  return (
    <Link
      to={url}
      className={`pointer no-underline br1 fw6 f7 dib pv2 ph3 ba b--red white bg-red ${className}`}
    >
      {children}
    </Link>
  );
}
