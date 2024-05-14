import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export function SectionMenu({ items }: Object) {
  const location = useLocation();
  const linkCombo = 'link mh2 blue-dark ttc';

  const isActive = (href) => location.pathname === href.split('?')[0];

  return (
    <div className="cf mb2 pb3 pt3-ns ph4 ph2-m bg-grey-light dib">
      {items.map((item) => (
        <Link
          key={item.url}
          to={item.url}
          className={isActive(item.url) ? `${linkCombo} bb b--blue-dark bw1 pb1` : linkCombo}
        >
          <span className="db dib-ns">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
