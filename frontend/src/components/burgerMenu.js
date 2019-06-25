import React from 'react';


export const BurgerMenu = ({ open, ...props }) => (
  <button className="btn burger-menu" {...props}>
    <div className="bar1" key="b1" />
    <div className="bar2" key="b2" />
    <div className="bar3" key="b3" />
  </button>
);
