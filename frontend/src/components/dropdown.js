import React from 'react';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import onClickOutside from 'react-click-outside';

import { Button } from './button';


class DropdownContent extends React.PureComponent {
  isActive = (obj: Object) => {
    for (let v of this.props.value) {
      if (v.label === obj.label) {
        return true;
      }
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
      <div className="di tl mt1 ba b--grey-light br1 fixed shadow-1 z-1 flex flex-column">
        {this.props.options.map((i, k) =>
          <span
            key={k}
            onClick={this.handleClick.bind(null, i)}
            className="pa3 bg-white bg-animate hover-bg-red-light"
          >
            {this.props.multi &&
              <input
                data-label={i.label}
                data-payload={JSON.stringify(i)}
                type="checkbox"
                checked={this.isActive(i)}
                value={i.label}
                className="mr2"
              />}
            {i.href
              ? <a
                  target={'_blank'}
                  href={i.href}
                  onClick={this.props.toggleDropdown}
                  className={`${this.isActive(i) && 'b'}`}
                >
                  {i.label}
                </a>
              : <span
                  onClick={this.props.toggleDropdown}
                  className={`${this.isActive(i) && 'b'}`}
                >
                  {i.label}
                </span>
            }
            {this.props.deletable &&
              <span
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  this.props.toggleDropdown();
                  this.props.deletable(i.value);
                }}
              >
                x
              </span>}
          </span>
        )}
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
    multi: boolean
  };

  state = {
    display: false
  };
  handleClickOutside = () => {
    this.setState({
      display: false
    });
  };
  toggleDropdown = () => {
    this.setState({
      display: !this.state.display
    });
  };
  isActive = (obj: Object) => {
    for (let v of this.props.value) {
      if (v.label === obj.label) {
        return true;
      }
    }
    return false;
  };
  render() {
    return (
      <div className={`dib pointer ba b--grey-light ${this.props.className || ''}`}>
        <Button
          icon={faChevronDown}
          onClick={this.toggleDropdown}
          className={`${this.props.className || ''}`}
        >
          {this.props.display}
        </Button>
        {this.state.display &&
          <DropdownContent
            {...this.props}
            eventTypes={['click', 'touchend']}
            toggleDropdown={this.toggleDropdown}
          />}
      </div>
    );
  }
}

export const Dropdown = onClickOutside(_Dropdown);
