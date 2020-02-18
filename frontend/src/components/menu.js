import React from 'react';
import { TopNavLink } from './header/NavLink';

export function SectionMenu({ items }: Object) {
  const isActive = ({ isCurrent }) => {
    const linkCombo = 'link mh2 blue-dark ttc';
    return isCurrent
      ? { className: `${linkCombo} bb b--blue-dark bw1 pb1` }
      : { className: linkCombo };
  };
  return (
    <div className="cf mb2 pb3 pt3-ns ph4 ph2-m bg-grey-light dib">
      {items.map((item, n) => (
        <TopNavLink key={n} to={item.url} isActive={isActive}>
          <span className="db dib-ns">{item.label}</span>
        </TopNavLink>
      ))}
    </div>
  );
}
