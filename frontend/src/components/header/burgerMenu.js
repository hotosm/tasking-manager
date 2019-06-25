import React from 'react';


export const BurgerMenu = ({ open, ...props }) => (
  <button
    className="blue-dark bg-white br1 f5 bn pointer"
    style={{padding: ".75rem 1.5rem"}}
    {...props}
  >
    <div className="bar1" key="b1" />
    <div className="bar2" key="b2" />
    <div className="bar3" key="b3" />
  </button>
);
