import React from 'react';
import { FormattedMessage } from 'react-intl';

import projectMessages from './messages';
import userDetailMessages from '../userDetail/messages';
import { MappingIcon, HomeIcon, RoadIcon, EditIcon } from '../svgIcons';
import { StatsCardContent } from '../statsCardContent';

const getFieldData = (field) => {
  const iconClass = 'h-50 w-50';
  const iconStyle = { height: '45px' };
  switch (field) {
    case 'buildings':
      return {
        icon: <HomeIcon className={iconClass} style={iconStyle} />,
        message: <FormattedMessage {...userDetailMessages.buildingsMapped} />,
      };
    case 'roads':
      return {
        icon: <RoadIcon className={iconClass} style={iconStyle} />,
        message: <FormattedMessage {...userDetailMessages.roadMapped} />,
      };
    case 'changesets':
      return {
        icon: <MappingIcon className={iconClass} style={iconStyle} />,
        message: <FormattedMessage {...projectMessages.changesets} />,
      };
    case 'edits':
      return {
        icon: <EditIcon className={iconClass} style={iconStyle} />,
        message: <FormattedMessage {...projectMessages.totalEdits} />,
      };
    default:
      return null;
  }
};

const Element = ({ field, value }) => {
  const element = getFieldData(field);
  return (
    <div className={`w-25-ns w-100 ph2-ns fl`}>
      <div className={`cf shadow-4 pt3 pb3 ph2 bg-white blue-dark`}>
        <div className="w-30 w-100-m fl tc red">{element.icon}</div>
        <StatsCardContent
          value={Math.trunc(value)}
          label={element.message}
          className="w-70 w-100-m pt3-m mb1 fl tc"
        />
      </div>
    </div>
  );
};

export const EditsStats = ({ data }) => {
  const { changesets, buildings, roads, edits } = data;

  return (
    <div className="cf w-100 pb4 ph2 ph4-ns blue-dark">
      <h3 className="barlow-condensed ttu f3">
        <FormattedMessage {...projectMessages.edits} />
      </h3>
      <div className="cf db pb2">
        <Element field="changesets" value={changesets || 0} />
        <Element field="edits" value={edits || 0} />
        <Element field="buildings" value={buildings || 0} />
        <Element field="roads" value={roads || 0} />
      </div>
    </div>
  );
};
