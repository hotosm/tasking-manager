import React, { useState, useEffect } from 'react';
import { ChevronRightIcon } from '../svgIcons';
import { useWindowSize } from '../../hooks/UseWindowSize';

import './styles.scss';

export function HorizontalScroll({
  className,
  menuItemsContainerRef,
  containerClass,
  style = {},
  children,
}) {
  const [scrollLeft, setScrollLeft] = useState(0);
  // This triggers rerender when the screen size changes, so had to keep it
  // even if it's unused
  // eslint-disable-next-line no-unused-vars
  const size = useWindowSize();

  useEffect(() => {
    const menuItemsContainer = document.querySelector(containerClass);
    menuItemsContainer.addEventListener('scroll', updateScrollLeft);

    return () => {
      menuItemsContainer.removeEventListener('scroll', updateScrollLeft);
    };
  }, [containerClass]);

  const updateScrollLeft = (e) => {
    setScrollLeft(e.target.scrollLeft);
  };

  const handleScroll = (direction) => {
    let currentScroll = scrollLeft;
    if (direction === 'right') {
      currentScroll += 200;
    } else {
      currentScroll -= 200;
    }
    menuItemsContainerRef.current.scrollTo({
      left: currentScroll,
      behavior: 'smooth',
    });
  };

  return (
    <div className={`relative overflow-hidden ${className || ''}`} style={style}>
      <ChevronRightIcon
        role="button"
        className={`bg-white absolute left-0 rotate-180 z-1 pointer pa2 translate-icon-btm ${
          scrollLeft > 0 ? 'db' : 'dn'
        }`}
        onClick={() => handleScroll('left')}
      />
      <ChevronRightIcon
        role="button"
        className={`translate-icon bg-white absolute right-0 z-1 pointer pa2 translate-icon ${
          scrollLeft <
          menuItemsContainerRef.current?.scrollWidth - menuItemsContainerRef.current?.clientWidth
            ? 'db'
            : 'dn'
        }`}
        onClick={() => handleScroll('right')}
      />
      {children}
    </div>
  );
}
