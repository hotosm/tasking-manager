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
        className={`white br1 f5 fw5 bn flex items-center ${buttonClassname}`}
        onClick={() => setIsActive(!isActive)}
        onBlur={() => setIsActive(false)}
      >
        {title}
        {isActive ? (
          <ChevronUpIcon className="ml2 partners-dropdown-icon" />
        ) : (
          <ChevronDownIcon className="ml2 partners-dropdown-icon" />
        )}
      </Button>

      {/* dropdown list */}
      {isActive && (
        <ul className="absolute list bg-grey-dark white pv3 mt2 partners-custom-dropdown">
          {data.map((option) => (
            <li
              key={option.label}
              className="pointer partners-dropdown-list-item"
              onMouseDown={() => {
                option?.onClick(option);
              }}
              onKeyDown={() => {}}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
