import React from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ManagementMenu } from './menu';
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
    <PlusIcon height="20px" width="20px" className="v-mid" />
    <span className="v-mid f3 ttu pl2">
      <FormattedMessage {...messages.add} />
    </span>
  </CustomButton>
);

export const DeleteButton = ({ className, onClick }: Object) => (
  <CustomButton
    className={`red bg-transparent ba b--red barlow-condensed pv1 ${className}`}
    onClick={onClick}
  >
    <WasteIcon height="20px" width="20px" className="v-mid" />
    <span className="v-mid f3 ttu pl2">
      <FormattedMessage {...messages.delete} />
    </span>
  </CustomButton>
);

export function VisibilityBox({ visibility, extraClasses }: Object) {
  let color = visibility === 'PUBLIC' ? 'blue-grey' : 'red';
  let borderColor = visibility === 'PUBLIC' ? 'b--grey' : 'b--red';
  const text = visibility ? <FormattedMessage {...messages[visibility.toLowerCase()]} /> : '';

  return <div className={`tc br1 f7 ttu ba ${borderColor} ${color} ${extraClasses}`}>{text}</div>;
}

export function InviteOnlyBox({ className }: Object) {
  return (
    <div className={`tc br1 f7 ttu ba red b--red ${className}`}>
      <FormattedMessage {...messages.inviteOnly} />
    </div>
  );
}

export function Management(props) {
  return (
    <div className="pull-center cf pb4 ph5-l bg-tan">
      {props.managementView && <ManagementMenu />}
      <div className="cf mt4">
        <h3 className="barlow-condensed f2 ma0 pv3 dib v-mid ttu pl2 pl0-l">{props.title}</h3>
        {props.showAddButton && (
          <Link to={'new/'} className="dib ml3">
            <AddButton />
          </Link>
        )}
      </div>
      <div className="w-100 cf dib">{props.children}</div>
    </div>
  );
}
