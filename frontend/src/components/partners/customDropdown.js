import { useState } from 'react';

import { Button } from '../button';
import { ChevronDownIcon } from '../svgIcons/chevron-down';
import { ChevronUpIcon } from '../svgIcons/chevron-up';

export const CustomDropdown = ({ title, data }) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="relative">
      {/* dropdown select */}
      <Button
        className="bg-grey-dark white mr3 br1 f5 bn flex items-center"
        onClick={() => setIsActive(!isActive)}
        onBlur={() => setIsActive(false)}
      >
        {isActive ? <ChevronUpIcon className="mr2" /> : <ChevronDownIcon className="mr2" />}
        {title}
      </Button>

      {/* dropdown list */}
      {isActive && (
        <ul
          className="absolute list bg-grey-dark white pv3"
          style={{ width: '17rem', right: '1rem', paddingInlineStart: '2rem' }}
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
