import React from 'react';
import { Link } from 'react-router-dom';
import { useIntl, FormattedMessage } from 'react-intl';
import ReactTooltip from 'react-tooltip';

import messages from './messages';
import { CustomButton } from '../button';
import { PlusIcon, WasteIcon } from '../svgIcons';

export const ViewAllLink = ({ link }: Object) => (
  <Link to={link} className="dib mt2 fr red link">
    <span>
      <FormattedMessage {...messages.viewAll} />
    </span>
  </Link>
);

export const AddButton = () => (
  <CustomButton className="red bg-transparent ba b--red barlow-condensed pv1">
    <PlusIcon className="v-mid h1 w1" />
    <span className="v-mid f4 fw6 ttu pl2">
      <FormattedMessage {...messages.new} />
    </span>
  </CustomButton>
);

export const DeleteButton = ({ className, onClick, showText = true }: Object) => {
  const intl = useIntl();
  return (
    <CustomButton className={`red bg-transparent ba b--red pv1 ${className}`} onClick={onClick}>
      <div data-for="Delete" data-tip={!showText ? intl.formatMessage(messages.delete) : ''}>
        <WasteIcon className="v-mid h1 w1" />
        {showText && (
          <span className="v-mid f4 fw6 ttu barlow-condensed pl2">
            <FormattedMessage {...messages.delete} />
          </span>
        )}
      </div>
      <ReactTooltip effect="solid" id="Delete" />
    </CustomButton>
  );
};

export function VisibilityBox({ visibility, extraClasses }: Object) {
  let color = visibility === 'PUBLIC' ? 'blue-grey' : 'red';
  let borderColor = visibility === 'PUBLIC' ? 'b--grey' : 'b--red';
  const text = visibility ? <FormattedMessage {...messages[visibility.toLowerCase()]} /> : '';

  return <div className={`tc br1 f7 ttu ba ${borderColor} ${color} ${extraClasses}`}>{text}</div>;
}

export function JoinMethodBox(props) {
  const teamJoinMethods = {
    ANY: 'anyoneCanJoin',
    BY_REQUEST: 'byRequest',
    BY_INVITE: 'byInvite',
  };
  return (
    <div className={`tc br1 f7 ttu ba red b--red ${props.className}`}>
      <FormattedMessage {...messages[teamJoinMethods[props.joinMethod]]} />
    </div>
  );
}

export function Management(props) {
  // admin users can switch between all teams/orgs and only their teams/orgs
  return (
    <div className="pull-center cf">
      <div style={{ textAlign: 'center' }} className=" cf pv4">
        <h3 className="barlow-condensed f2 ma0 dib v-mid ttu">{props.title}</h3>
        {props.showAddButton && (
          <Link to={'new/'} className="dib ml3">
            <AddButton />
          </Link>
        )}
        {props.isAdmin && (
          <div className="mt2 mb3">
            <CustomButton
              className={`link di f6 mr2 ph3 pv2 ba b--grey-light ${
                props.userOnly ? 'bg-white blue-grey' : 'bg-blue-grey white fw5'
              }`}
              onClick={() => {
                props.setUserOnly(false);
              }}
            >
              <FormattedMessage {...messages.all} />
            </CustomButton>
            <CustomButton
              className={`link di f6 mh1 ph3 pv2 ba b--grey-light ${
                props.userOnly ? 'bg-blue-grey white fw5' : 'bg-white blue-grey'
              }`}
              onClick={() => {
                props.setUserOnly(true);
              }}
            >
              {props.userOnlyLabel}
            </CustomButton>
          </div>
        )}
      </div>

      <div className="w-100 cf dib">{props.children}</div>
    </div>
  );
}
