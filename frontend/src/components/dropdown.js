import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, CheckIcon } from './svgIcons';
import { CustomButton } from './button';

const DropdownContent = React.forwardRef((props, ref) => {
  const navigate = useNavigate();
  const isActive = (obj) => {
    return props.value === obj.value;
  };

  const handleClick = (data) => {
    if (data) {
      const label = data.label;
      if (!props.value || !props.onChange) {
        if (!label) return;
        if (data.href && data.internalLink) {
          navigate(data.href);
        }
        return;
      }
      const value = props.value;
      let ourObj = data;
      if (!ourObj) return;

      let isRemove = false;
      for (let x = 0; x < value.length; x++) {
        if (value[x].label === label) {
          isRemove = true;
          props.onRemove && props.onRemove(ourObj);
          props.onChange(value.slice(0, x).concat(value.slice(x + 1)));
        }
      }

      if (!isRemove) {
        let newArray = value.slice(0, value.length);
        if (!props.multi) {
          newArray = [];
        }
        newArray.push(ourObj);
        props.onAdd && props.onAdd(ourObj);
        props.onChange(newArray);
      }
    }
    if (!props.multi) {
      props.toggleDropdown();
    }
  };

  return (
    <div
      ref={ref}
      className={`db tl mt1 ba b--grey-light br1 absolute shadow-1 z-5 flex flex-column${
        props.toTop ? ' bottom-3' : ''
      }${props.options.length > 9 ? ' h5 overflow-y-scroll' : ''}`}
    >
      {props.options.map((i, k) => (
        <span
          key={k}
          onClick={handleClick.bind(null, i)}
          className="pa3 nowrap bg-animate bg-white hover-bg-tan"
        >
          {props.multi && (
            <input
              data-label={i.label}
              data-payload={JSON.stringify(i)}
              type="checkbox"
              checked={isActive(i)}
              value={i.label}
              className="mr2"
            />
          )}
          {i.href ? (
            i.internalLink ? (
              <>
                {i.label}
                {isActive(i) && <CheckIcon className="red pl4" />}
              </>
            ) : (
              <a
                target={'_blank'}
                href={i.href}
                onClick={props.toggleDropdown}
                rel="noopener noreferrer"
                className="link blue-grey"
              >
                {i.label}
                {isActive(i) && <CheckIcon className="red pl4" />}
              </a>
            )
          ) : (
            <span onClick={props.toggleDropdown}>
              {i.label}
              {isActive(i) && (
                <span className="red pl4">
                  <CheckIcon />
                </span>
              )}
            </span>
          )}
          {props.deletable && (
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.toggleDropdown();
                props.deletable(i.value);
              }}
            >
              x
            </span>
          )}
        </span>
      ))}
    </div>
  );
});

export function Dropdown(props) {
  const [display, setDisplay] = useState(false);

  const contentRef = React.createRef();
  const buttonRef = React.createRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !contentRef.current ||
        contentRef.current.contains(event.target) ||
        !buttonRef.current ||
        buttonRef.current.contains(event.target)
      ) {
        return;
      }
      setDisplay(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [contentRef, buttonRef]);

  const toggleDropdown = () => {
    setDisplay(!display);
  };

  const getActiveOrDisplay = () => {
    const activeItems = props.options.filter(
      (item) => item.label === props.value || item.value === props.value,
    );
    return activeItems.length === 0 || activeItems.length > 1
      ? props.display
      : activeItems[0].label;
  };

  return (
    <div className="dib pointer relative">
      <CustomButton
        ref={buttonRef}
        onClick={toggleDropdown}
        className={`blue-dark ${props.className || ''}`}
      >
        <div className="lh-title dib ma0 f6">{getActiveOrDisplay()}</div>

        <ChevronDownIcon style={{ width: '11px', height: '11px' }} className="pl3 v-mid pr1" />
      </CustomButton>
      {display && (
        <DropdownContent
          ref={contentRef}
          {...props}
          eventTypes={['click', 'touchend']}
          toggleDropdown={toggleDropdown}
          toTop={props.toTop}
        />
      )}
    </div>
  );
}
