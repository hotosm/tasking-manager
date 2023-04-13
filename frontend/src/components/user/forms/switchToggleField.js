import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';

import { SwitchToggle } from '../../formInputs';
import { pushUserDetails } from '../../../store/actions/auth';

const mapStateToProps = (state) => ({
  userDetails: state.auth.userDetails,
  token: state.auth.token,
});

function _SwitchToggleField(props) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    if (value === null && props.userDetails.hasOwnProperty(props.fieldName)) {
      setValue(props.userDetails[props.fieldName]);
    }
  }, [value, props.userDetails, props.fieldName]);

  const onSwitchChange = () => {
    let payload = { id: props.userDetails.id };
    payload[props.fieldName] = !value;
    props.pushUserDetails(JSON.stringify(payload), props.token, true);
    setValue(!value);
  };

  let val = value;
  if ((val === undefined || val === null) && props.hasOwnProperty('default')) {
    val = props.default;
  }
  return (
    <div className={`fr ${props.removeVerticalPadding ? '' : 'pv2'} dib`}>
      <SwitchToggle onChange={(e) => onSwitchChange()} isChecked={val} />
    </div>
  );
}

export const SwitchToggleField = connect(mapStateToProps, { pushUserDetails })(_SwitchToggleField);
