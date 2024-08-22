import { createRef, forwardRef, useEffect, useState, RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, CheckIcon } from './svgIcons';
import { CustomButton } from './button';

interface DropdownOption {
  label: string;
  value: string;
  href?: string;
  internalLink?: boolean;
}

interface DropdownContentProps {
  value: DropdownOption | DropdownOption[];
  onChange?: (value: DropdownOption[]) => void;
  onRemove?: (option: DropdownOption) => void;
  onAdd?: (option: DropdownOption) => void;
  toggleDropdown: () => void;
  multi?: boolean;
  toTop?: boolean;
  options: DropdownOption[];
  deletable?: (value: string) => void;
}

const DropdownContent = forwardRef<HTMLDivElement, DropdownContentProps>((props, ref) => {
  const navigate = useNavigate();

  const isActive = (obj: DropdownOption): boolean => {
    return Array.isArray(props.value)
      ? props.value.some(item => item.value === obj.value)
      : props.value.value === obj.value;
  };

  const handleClick = (data: DropdownOption) => {
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
      if (Array.isArray(value)) {
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
                props.deletable?.(i.value);
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

interface DropdownProps {
  options: DropdownOption[];
  value: DropdownOption | DropdownOption[]; // Changed here
  display: string;
  className?: string;
  toTop?: boolean;
  multi?: boolean;
  onChange?: (value: DropdownOption[]) => void;
  onRemove?: (option: DropdownOption) => void;
  onAdd?: (option: DropdownOption) => void;
  deletable?: (value: string) => void;
}

export function Dropdown(props: DropdownProps) {
  const [display, setDisplay] = useState<boolean>(false);

  const contentRef: RefObject<HTMLDivElement> = createRef();
  const buttonRef: RefObject<HTMLButtonElement> = createRef();

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        !contentRef.current ||
        contentRef.current.contains(event.target as Node) ||
        !buttonRef.current ||
        buttonRef.current.contains(event.target as Node)
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

  const getActiveOrDisplay = (): string => {
    const activeItems = props.options.filter((item) => {
      if (Array.isArray(props.value)) {
        return props.value.some(v => v.label === item.label || v.value === item.value);
      }
      return item.label === props.value.label || item.value === props.value.value;
    });
    return activeItems.length === 0 || activeItems.length > 1
      ? props.display
      : activeItems[0].label
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
          toggleDropdown={toggleDropdown}
          toTop={props.toTop}
        />
      )}
    </div>
  );
}
