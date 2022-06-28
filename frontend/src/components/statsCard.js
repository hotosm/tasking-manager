import React from 'react';
import { FormattedNumber } from 'react-intl';

export const StatsCard = ({ icon, description, value, className, invertColors = false }) => {
  return (
    <div className={`${className} ph2-ns fl`}>
      <div className={`cf shadow-4 pt3 pb3 ph2 ${invertColors ? 'bg-red white' : 'bg-white red'}`}>
        <div className="w-30 w-100-m fl tc">{icon}</div>
        <StatsCardContent
          value={
            Number(value) || value === 0 ? <FormattedNumber value={Math.trunc(value)} /> : value
          }
          label={description}
          className="w-70 w-100-m pt3-m mb1 fl tc"
          invertColors={invertColors}
        />
      </div>
    </div>
  );
};

export const StatsCardContent = ({ value, label, className, invertColors = false }: Object) => (
  <div className={className}>
    <h3 className={`ma0 mb2 barlow-condensed f2 b ${invertColors ? 'white' : 'red'}`}>{value}</h3>
    <span className={`ma0 h2 f7 b ${invertColors ? 'white' : 'blue-grey'}`}>{label}</span>
  </div>
);
