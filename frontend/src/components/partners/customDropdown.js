import { useState } from 'react';

import { Button } from '../button';
import { ChevronDownIcon } from '../svgIcons/chevron-down';
import { ChevronUpIcon } from '../svgIcons/chevron-up';

export const CustomDropdown = ({ title, data, buttonClassname }) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="relative">
      {/* dropdown select */}
      <Button
        className={`white br1 f5 bn flex items-center ${buttonClassname}`}
        onClick={() => setIsActive(!isActive)}
        onBlur={() => setIsActive(false)}
        style={{ padding: '0.75rem 0' }}
      >
        {title}
        {isActive ? (
          <ChevronUpIcon style={{ width: '12px' }} className="ml2" />
        ) : (
          <ChevronDownIcon style={{ width: '12px' }} className="ml2" />
        )}
      </Button>

      {/* dropdown list */}
      {isActive && (
        <ul
          className="absolute list bg-grey-dark white pv3 mt2"
          style={{
            width: '17rem',
            right: '0',
            padding: '0.5rem 2rem',
          }}
        >
          {data.map((option) => (
            <li
              key={option.label}
              className="pointer"
              style={{ padding: '0.75rem 0' }}
              onMouseDown={() => {
                option?.onClick(option);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
