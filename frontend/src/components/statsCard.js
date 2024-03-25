import { FormattedNumber } from 'react-intl';

export const StatsCard = ({ icon, description, value, className, invertColors = false }) => {
  return (
    <div
      className={`cf pt3 pb3 ph3 br1 ${
        invertColors ? 'bg-red white' : 'bg-white red shadow-6'
      } flex items-center ${className || ''}`}
    >
      <div className="w-30 fl ml2">{icon}</div>
      <StatsCardContent
        value={Number(value) || value === 0 ? <FormattedNumber value={Math.trunc(value)} /> : value}
        label={description}
        className="w-70 pt3-m mb1 fl"
        invertColors={invertColors}
      />
    </div>
  );
};

export const StatsCardContent = ({ value, label, className, invertColors = false }: Object) => (
  <div className={className}>
    <h3 className={`ma0 mb1 barlow-condensed f2 fw5 ${invertColors ? 'white' : 'red'}`}>{value}</h3>
    <span className={`ma0 h2 f7 fw5 ${invertColors ? 'white' : 'blue-grey'}`}>{label}</span>
  </div>
);
