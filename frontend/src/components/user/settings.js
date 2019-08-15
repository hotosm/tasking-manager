import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import { UserAvatar } from './avatar';
import { ProfileCompleteness } from './completeness';
import { MappingLevelMessage } from '../mappingLevel';
import { cancelablePromise } from '../../utils/promise';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { INTERMEDIATE_LEVEL_COUNT, ADVANCED_LEVEL_COUNT } from '../../config';

function NextMappingLevel({ changesetsCount }: Object) {
  changesetsCount = Number(changesetsCount);
  let changesetsLeft, nextLevel;
  if (changesetsCount < INTERMEDIATE_LEVEL_COUNT) {
    changesetsLeft = <FormattedNumber value={INTERMEDIATE_LEVEL_COUNT - changesetsCount} />;
    nextLevel = <MappingLevelMessage level="INTERMEDIATE" className="ttl " />;
  } else if (changesetsCount < ADVANCED_LEVEL_COUNT) {
    changesetsLeft = <FormattedNumber value={ADVANCED_LEVEL_COUNT - changesetsCount} />;
    nextLevel = <MappingLevelMessage level="ADVANCED" className="ttl" />;
  }
  if (nextLevel) {
    return (
      <span className="blue-grey">
        <FormattedMessage
          {...messages.nextLevel}
          className="blue-grey"
          values={{
            number: <span className="blue-dark f4 fw6">{changesetsLeft}</span>,
            level: nextLevel,
          }}
        />
      </span>
    );
  }
  return '';
}

class UserTopBar extends React.Component {
  osmDetailsPromise;
  state = {
    changesetsCount: 0,
    finishedLoadingData: false,
  };

  componentDidUpdate(prevProps) {
    if (
      this.props.userDetails &&
      this.props.userDetails.mappingLevel !== 'ADVANCED' &&
      this.props.userDetails.username &&
      prevProps.userDetails.username !== this.props.userDetails.username
    ) {
      this.getOSMDetails();
    }
  }

  componentWillUnmount() {
    this.osmDetailsPromise && this.osmDetailsPromise.cancel();
  }

  getOSMDetails = event => {
    this.osmDetailsPromise = cancelablePromise(
      fetchLocalJSONAPI(`user/${this.props.userDetails.username}/osm-details`),
    );
    this.osmDetailsPromise.promise
      .then(r => {
        this.setState({
          changesetsCount: r.changesetCount,
          finishedLoadingData: true,
        });
      })
      .catch(e => console.log(e));
  };

  render() {
    return (
      <div className="cf ph4 pt3 pb1">
        <div className="w-100 w-75-l fl pb2">
          <div className="fl dib pr3">
            <UserAvatar className="h4 br-100 pa1 ba b--grey-light bw3" />
          </div>
          <div className="pl2 dib">
            <h3 className="ttu f2 fw-6 mv0 barlow-condensed">
              {this.props.userDetails.name || this.props.userDetails.username}
            </h3>
            <p className="f4 mt3 mb2">
              <FormattedMessage
                {...messages.mapper}
                values={{
                  level: <MappingLevelMessage level={this.props.userDetails.mappingLevel} />,
                }}
              />
            </p>
            {this.state.finishedLoadingData && (
              <NextMappingLevel changesetsCount={this.state.changesetsCount} />
            )}
          </div>
        </div>
        <div className="w-100 w-25-l fl pb2">
          <ProfileCompleteness userDetails={this.props.userDetails} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  userDetails: state.auth.get('userDetails'),
});

UserTopBar = connect(mapStateToProps)(UserTopBar);

export { UserTopBar, NextMappingLevel };
