import { forwardRef, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { ChevronDownIcon, CheckIcon } from './svgIcons';
import { CustomButton } from './button';
import messages from './messages';

const ITEM_SELECTOR = '[role^="menuitem"]';

// The "x" on deletable options. Mouse users click it; keyboard users press
// Delete or Backspace on the option itself (see handleKeyDown below).
function DeleteOption({ onDelete }) {
  const intl = useIntl();
  return (
    <span
      role="button"
      tabIndex={-1}
      aria-label={intl.formatMessage(messages.remove)}
      onClick={onDelete}
    >
      x
    </span>
  );
}

const DropdownContent = forwardRef((props, ref) => {
  const navigate = useNavigate();
  const isActive = (obj) => {
    return props.value === obj.value;
  };

  const getItems = () =>
    ref && ref.current ? Array.from(ref.current.querySelectorAll(ITEM_SELECTOR)) : [];

  // When the menu opens, move focus to the selected option, or the first one.
  useEffect(() => {
    const items = getItems();
    if (!items.length) return;
    const activeIndex = props.options.findIndex((option) => isActive(option));
    (items[activeIndex] || items[0]).focus();
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleKeyDown = (event, option) => {
    const items = getItems();
    const current = items.indexOf(document.activeElement);
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const next = current === -1 ? 0 : (current + step + items.length) % items.length;
        items[next] && items[next].focus();
        break;
      }
      case 'Home':
      case 'End':
        event.preventDefault();
        items.length && items[event.key === 'Home' ? 0 : items.length - 1].focus();
        break;
      case 'Escape':
        event.preventDefault();
        props.closeDropdown(true);
        break;
      case 'Tab':
        props.closeDropdown(false);
        break;
      case 'Enter':
      case ' ':
        if (option.href && !option.internalLink) {
          // external links follow on Enter natively; give Space the same behaviour
          if (event.key === ' ') {
            event.preventDefault();
            event.currentTarget.click();
          }
          return;
        }
        event.preventDefault();
        handleClick(option);
        // single-select closes and hands focus back to the trigger; multi stays open
        if (!props.multi) props.closeDropdown(true);
        break;
      case 'Delete':
      case 'Backspace':
        if (props.deletable) {
          event.preventDefault();
          props.closeDropdown(true);
          props.deletable(option.value);
        }
        break;
      default:
    }
  };

  const itemRole = props.multi ? 'menuitemcheckbox' : 'menuitem';

  return (
    <div
      ref={ref}
      role="menu"
      className={`db tl mt1 ba b--grey-light br1 absolute shadow-1 z-5 flex flex-column${
        props?.toRight ? ' right-0' : ''
      }${props.toTop ? ' bottom-3' : ''}${props.options.length > 9 ? ' h5 overflow-y-scroll' : ''}`}
    >
      {props.options.map((i, k) => {
        const active = isActive(i);
        // external link options: the <a> itself is the focusable menu item
        const isExternalLink = i.href && !i.internalLink;
        const itemProps = {
          role: itemRole,
          tabIndex: -1,
          onKeyDown: (e) => handleKeyDown(e, i),
          ...(props.multi ? { 'aria-checked': active } : {}),
        };
        return (
          <span
            key={k}
            onClick={handleClick.bind(null, i)}
            className="pa3 nowrap bg-animate bg-white hover-bg-tan"
            {...(isExternalLink ? { role: 'none' } : itemProps)}
          >
            {props.multi && (
              <input
                data-label={i.label}
                data-payload={JSON.stringify(i)}
                type="checkbox"
                checked={active}
                value={i.label}
                className="mr2"
                tabIndex={-1}
                aria-hidden="true"
                readOnly
              />
            )}
            {i.href ? (
              i.internalLink ? (
                <>
                  {i.label}
                  {active && <CheckIcon className="red pl4" />}
                </>
              ) : (
                <a
                  target={'_blank'}
                  href={i.href}
                  onClick={props.toggleDropdown}
                  rel="noopener noreferrer"
                  className="link blue-grey"
                  {...itemProps}
                >
                  {i.label}
                  {active && <CheckIcon className="red pl4" />}
                </a>
              )
            ) : (
              <span onClick={props.toggleDropdown}>
                {i.label}
                {active && (
                  <span className="red pl4">
                    <CheckIcon />
                  </span>
                )}
              </span>
            )}
            {props.deletable && (
              <DeleteOption
                onDelete={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  props.toggleDropdown();
                  props.deletable(i.value);
                }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
});

export function Dropdown(props) {
  const [display, setDisplay] = useState(false);

  const contentRef = useRef();
  const buttonRef = useRef();

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

  const focusTrigger = () => {
    buttonRef.current && buttonRef.current.focus();
  };

  const closeDropdown = (returnFocus) => {
    setDisplay(false);
    if (returnFocus) focusTrigger();
  };

  const handleTriggerKeyDown = (event) => {
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && !display) {
      event.preventDefault();
      setDisplay(true);
    }
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
        aria-pressed={undefined}
        aria-haspopup="menu"
        aria-expanded={display}
        onKeyDown={handleTriggerKeyDown}
      >
        <div className="lh-title dib ma0 f6">{getActiveOrDisplay()}</div>

        <ChevronDownIcon
          style={{ width: '11px', height: '11px' }}
          className="pl3 v-mid pr1"
          aria-hidden="true"
        />
      </CustomButton>
      {display && (
        <DropdownContent
          ref={contentRef}
          {...props}
          eventTypes={['click', 'touchend']}
          toggleDropdown={toggleDropdown}
          closeDropdown={closeDropdown}
          toTop={props.toTop}
        />
      )}
    </div>
  );
}

DropdownContent.propTypes = {
  toTop: PropTypes.bool,
  toRight: PropTypes.bool,
  toggleDropdown: PropTypes.func.isRequired,
  closeDropdown: PropTypes.func.isRequired,
  eventTypes: PropTypes.arrayOf(PropTypes.string),
};
