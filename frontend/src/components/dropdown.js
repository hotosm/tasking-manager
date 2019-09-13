import React from 'react';
import onClickOutside from 'react-click-outside';

import { ChevronDownIcon, CheckIcon } from './svgIcons';
import { CustomButton } from './button';

class DropdownContent extends React.PureComponent {
  isActive = (obj: Object) => {
    if (this.props.value === obj.label) {
      return true;
    }
    return false;
  };
  handleClick = (data: Object) => {
    if (data) {
      var label = data.label;
      if (!label || !this.props.value || !this.props.onChange) return;
      const value = this.props.value;
      let ourObj = data;
      if (!ourObj) return;

      let isRemove = false;
      for (let x = 0; x < value.length; x++) {
        if (value[x].label === label) {
          isRemove = true;
          this.props.onRemove(ourObj);
          this.props.onChange(value.slice(0, x).concat(value.slice(x + 1)));
        }
      }

      if (!isRemove) {
        let newArray = value.slice(0, value.length);
        if (!this.props.multi) {
          newArray = [];
        }
        newArray.push(ourObj);
        this.props.onAdd(ourObj);
        this.props.onChange(newArray);
      }
    }
    if (!this.props.multi) {
      this.props.toggleDropdown();
    }
  };
  render() {
    return (
      <div className="di tl mt1 ba b--grey-light br1 absolute shadow-1 z-3 flex flex-column">
        {this.props.options.map((i, k) => (
          <span
            key={k}
            onClick={this.handleClick.bind(null, i)}
            className="pa3 bg-animate bg-white hover-bg-tan"
          >
            {this.props.multi && (
              <input
                data-label={i.label}
                data-payload={JSON.stringify(i)}
                type="checkbox"
                checked={this.isActive(i)}
                value={i.label}
                className="mr2"
              />
            )}
            {i.href ? (
              <a target={'_blank'} href={i.href} onClick={this.props.toggleDropdown}>
                {i.label}
                {this.isActive(i) && (
                  <span className="red pl4">
                    <CheckIcon />
                  </span>
                )}
              </a>
            ) : (
              <span onClick={this.props.toggleDropdown}>
                {i.label}
                {this.isActive(i) && (
                  <span className="red pl4">
                    <CheckIcon />
                  </span>
                )}
              </span>
            )}
            {this.props.deletable && (
              <span
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  this.props.toggleDropdown();
                  this.props.deletable(i.value);
                }}
              >
                x
              </span>
            )}
          </span>
        ))}
      </div>
    );
  }
}

export class _Dropdown extends React.PureComponent {
  props: {
    className: string,
    disabled: boolean,
    value: Array<Object>,
    onChange: (Array<Object>) => any,
    onAdd: (?Object) => any,
    onRemove: (?Object) => any,
    options: Array<Object>,
    display: string,
    deletable?: (value: string) => any,
    multi: boolean,
  };

  state = {
    display: false,
  };
  handleClickOutside = () => {
    this.setState({
      display: false,
    });
  };
  toggleDropdown = () => {
    this.setState({
      display: !this.state.display,
    });
  };
  isActive = (obj: Object) => {
    //eslint-disable-next-line
    for (let v of this.props.value) {
      if (v.label === obj.label) {
        return true;
      }
    }
    return false;
  };
  getActiveOrDisplay() {
    const activeItems = this.props.options.filter(item => item.label === this.props.value || item.value === this.props.value);
    return activeItems.length === 0 || activeItems.length > 1
      ? this.props.display
      : activeItems[0].label;
  }
  render() {
    return (
      <div className={`dib pointer`}>
        <CustomButton onClick={this.toggleDropdown} className={`${this.props.className || ''}`}>
          {this.getActiveOrDisplay()}{' '}
          <ChevronDownIcon style={{ height: '14px' }} className="pl2 v-mid" />
        </CustomButton>
        {this.state.display && (
          <DropdownContent
            {...this.props}
            eventTypes={['click', 'touchend']}
            toggleDropdown={this.toggleDropdown}
          />
        )}
      </div>
    );
  }
}

export const Dropdown = onClickOutside(_Dropdown);
