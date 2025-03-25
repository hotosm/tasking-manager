import { FormattedNumber } from 'react-intl';
import PropTypes from 'prop-types';

import shortNumber from 'short-number';

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

export const StatsCardWithFooter = ({
  icon,
  description,
  value,
  className,
  delta,
  invertColors = false,
  style,
}) => {
  return (
    <div
      className={`cf pt3 pb3 ph3 br1 ${
        invertColors ? 'bg-red white' : 'bg-white red shadow-6'
      } flex flex-column ${className || ''}`}
      style={style}
    >
      <div className="flex items-center w-100" style={{ gap: '1.6rem' }}>
        <div className="ml2">{icon}</div>
        <StatsCardWithFooterContent
          value={
            Number(value) || value === 0 ? <FormattedNumber value={Math.trunc(value)} /> : value
          }
          label={description}
          className="w-70 pt3-m mb1 fl"
          invertColors={invertColors}
        />
      </div>
      {delta ? (
        <div
          className={`ma0 ml2 gray f6 fw4 ${invertColors ? 'white' : 'blue-grey'}`}
          style={{ marginTop: '1.5rem' }}
        >
          {delta}
        </div>
      ) : null}
    </div>
  );
};

StatsCardWithFooter.propTypes = {
  icon: PropTypes.node,
  description: PropTypes.node,
  value: PropTypes.node,
  className: PropTypes.string,
  delta: PropTypes.node,
  invertColors: PropTypes.bool,
  style: PropTypes.object,
};

export const StatsCardContent = ({ value, label, className, invertColors = false }) => (
  <div className={className}>
    <h3 className={`ma0 mb1 barlow-condensed f2 fw5 ${invertColors ? 'white' : 'red'}`}>{value}</h3>
    <span className={`ma0 h2 f7 fw5 ${invertColors ? 'white' : 'blue-grey'}`}>{label}</span>
  </div>
);

export const StatsCardWithFooterContent = ({ value, label, className, invertColors = false }) => (
  <div className={className}>
    <h3 className={`ma0 mb1 barlow-condensed f1 fw6 ${invertColors ? 'white' : 'red'}`}>{value}</h3>
    <span className={`ma0 h2 f6 fw6 ${invertColors ? 'white' : 'blue-grey'}`}>{label}</span>
  </div>
);

StatsCardWithFooterContent.propTypes = {
  value: PropTypes.node,
  label: PropTypes.node,
  className: PropTypes.string,
  invertColors: PropTypes.bool,
};

function getFormattedNumber(num) {
  if (typeof num !== 'number') return '-';
  const value = shortNumber(num);
  return typeof value === 'number' ? <FormattedNumber value={Math.abs(value.toFixed(1))} /> : value;
}

export const DetailedStatsCard = ({
  icon,
  description,
  subDescription,
  mapped,
  created,
  modified,
  deleted,
  unitMore,
  unitLess,
}) => {
  return (
    <div
      className="cf pa3 br1 flex bg-white red shadow-6 flex-column justify-between"
      style={{ cursor: 'default' }}
    >
      <div className="flex items-center mb-auto">
        <div className="w-25 fl ml2">{icon}</div>
        <div>
          <h3 className="ma0 mb1 barlow-condensed f2 fw6 red">{getFormattedNumber(mapped)}</h3>
          <div className="flex flex-column">
            <span className="ma0 f7 fw5 blue-grey mb1">{description}</span>
            <span className="ma0 f7 fw5 blue-grey">{subDescription}</span>
          </div>
        </div>
      </div>

      {/* seperator line  */}
      <div className="flex justify-center">
        <div className="bg-red mv2" style={{ height: '1px', width: '96%' }} />
      </div>

      <div className="flex w-100 items-center mt-auto" style={{ justifyContent: 'space-evenly' }}>
        <div className="flex flex-column items-center">
          <h3 className="ma0 mb2 barlow-condensed fw6 red">{getFormattedNumber(created)}</h3>
          <span className="f7 fw5 blue-grey">Created</span>
        </div>
        <div className="flex flex-column items-center">
          <h3 className="ma0 mb2 barlow-condensed fw6 red flex items-center" style={{ gap: '5px' }}>
            {!isNaN(unitMore || unitLess) ? (
              <>
                +{getFormattedNumber(unitMore)}
                {/* seperator line  */}
                <div className="flex justify-center">
                  <div className="bg-blue-grey" style={{ height: '1rem', width: '1px' }} />
                </div>
                -{getFormattedNumber(unitLess)}
              </>
            ) : (
              getFormattedNumber(modified)
            )}
          </h3>
          <span className="f7 fw5 blue-grey">Modified</span>
        </div>
        <div className="flex flex-column items-center">
          <h3 className="ma0 mb2 barlow-condensed fw6 red">{getFormattedNumber(deleted)}</h3>
          <span className="f7 fw5 blue-grey">Deleted</span>
        </div>
      </div>
    </div>
  );
};
