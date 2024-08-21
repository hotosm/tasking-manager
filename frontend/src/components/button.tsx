import { Link } from 'react-router-dom';

import { LoadingIcon } from './svgIcons';
import React from 'react';

const IconSpace = ({ children }: { children: React.ReactNode }) => (
  <span className="mr2">{children}</span>
);
export const AnimatedLoadingIcon = () => (
  <IconSpace>
    <LoadingIcon className="h1 w1 v-mid" style={{ animation: 'spin 1s linear infinite' }} />
  </IconSpace>
);

<<<<<<< HEAD
export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: React.ReactNode;
    loading?: boolean;
  },
) {
  const { children, icon, className, loading = false, disabled, ...rest } = props;
=======
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode,
  loading?: boolean,
};

export function Button(props: ButtonProps) {
  const { children, icon, className, loading = false, disabled, ...rest } = props
>>>>>>> 454d43caf (chore(frontend): more ts migrations)

  return (
    <button
      aria-pressed="false"
      // focusindex="0"
      className={`${className || ''} br1 f5 bn ${disabled || loading ? 'o-50' : 'pointer'}`}
      style={{ padding: '.75rem 1.5rem' }}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <AnimatedLoadingIcon /> : icon && <IconSpace>{icon}</IconSpace>}
      {children}
    </button>
  );
}

export function FormSubmitButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: React.ReactNode;
    loading?: boolean;
    disabledClassName?: string;
  },
) {
  const {
    children,
    icon,
    className,
    loading = false,
    disabled,
    disabledClassName,
    ...rest
  } = props;
  return (
    <button
      type="submit"
      aria-pressed="false"
      // focusindex="0"
      className={`${disabled ? disabledClassName : className} br1 f5 bn ${
        disabled || loading ? '' : 'pointer'
      }`}
      style={{ padding: '.75rem 2.5rem' }}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <AnimatedLoadingIcon /> : icon && <IconSpace>{icon}</IconSpace>}
      {children}
    </button>
  );
}

export const CustomButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: React.ReactNode;
    loading?: boolean;
  }
>((props, ref) => {
  const { children, icon, className, loading = false, disabled, onClick, ...rest } = props;
  return (
    <button
      onClick={onClick}
      ref={ref}
      aria-pressed="false"
      // focusindex="0"
      className={`${className || ''} br1 f5 ${disabled || loading ? 'o-50' : 'pointer'}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <AnimatedLoadingIcon /> : icon && <IconSpace>{icon}</IconSpace>}
      {children}
    </button>
  );
});

export function EditButton(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    url: string;
  },
) {
  const { children, className = 'mh1 mv1', url, ...rest } = props;
  return (
    <Link
      to={url}
      {...rest}
      className={`pointer no-underline br1 fw6 f7 dib pv2 ph3 ba b--red white bg-red ${className}`}
    >
      {children}
    </Link>
  );
}
