import { Tooltip } from 'react-tooltip';

export function InfoBox({
  title,
  tooltip,
  className,
  id = 'infoBoxTooltip',
  color = '#116530',
  backgroundColor = '#a8e6cf',
}) {
  return (
    <>
      <div
        className={`dib br1 ph2 f8 fw6 ${className}`}
        data-tooltip-id={id}
        style={{
          backgroundColor: backgroundColor,
          color: color,
          paddingTop: '0.375rem',
          paddingBottom: '0.375rem',
        }}
      >
        {title}
      </div>
      {tooltip && (
        <Tooltip
          id={id}
          place="right"
          style={{
            backgroundColor: '#4c4f56',
            color: '#fff',
            fontSize: '0.75rem',
            maxWidth: '15rem',
          }}
        >
          {tooltip}
        </Tooltip>
      )}
    </>
  );
}
