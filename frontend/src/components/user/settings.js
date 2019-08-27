import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import { TextRow } from 'react-placeholder/lib/placeholders';

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
    if (
      this.props.userDetails &&
      this.props.userDetails.mappingLevel === 'ADVANCED' &&
      this.props.userDetails.username &&
      prevProps.userDetails.username !== this.props.userDetails.username
    ) {
      this.setState({ finishedLoadingData: true });
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
        console.log('ok');
        this.setState({
          changesetsCount: r.changesetCount,
          finishedLoadingData: true,
        });
      })
      .catch(e => console.log(e));
  };

  getPlaceholder() {
    return (
      <div className="pl2 dib">
        <TextRow style={{ width: 150, height: '2.3em' }} color="#eee" />
        <TextRow style={{ width: 150, height: '1em' }} color="#eee" />
        <TextRow style={{ width: 150, height: '1em' }} color="#eee" />
      </div>
    );
  }

  render() {
    return (
      <div className="cf ph4 pt3 pb1">
        <div className="w-100 w-75-l fl pb2">
          <div className="fl dib pr3">
            <UserAvatar className="h4 w4 br-100 pa1 ba b--grey-light bw3" />
          </div>
          <ReactPlaceholder
            showLoadingAnimation={true}
            customPlaceholder={this.getPlaceholder()}
            delay={500}
            ready={this.state.finishedLoadingData}
          >
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
              <NextMappingLevel changesetsCount={this.state.changesetsCount} />
            </div>
          </ReactPlaceholder>
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
