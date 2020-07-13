import React from 'react';

export const StatsCardContent = ({ value, label, className, invertColors = false }: Object) => (
  <div className={className}>
    <h3 className={`ma0 mb2 barlow-condensed f2 b ${invertColors ? 'white' : 'red'}`}>{value}</h3>
    <span className={`ma0 h2 f7 b ${invertColors ? 'white' : 'blue-grey'}`}>{label}</span>
  </div>
);
