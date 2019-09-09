import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import shortNumber from 'short-number';

import messages from './messages';
import { EDITS_API_URL } from '../../config';
import { cancelablePromise } from '../../utils/promise';
import { fetchLocalJSONAPI, fetchExternalJSONAPI } from '../../network/genericJSONRequest';

export class StatsNumber extends React.Component {
  render() {
    const value = shortNumber(this.props.value);
    if (typeof value === 'number') {
      return <FormattedNumber value={value} />;
    }
    return (
      <span>
        <FormattedNumber value={Number(value.substr(0, value.length - 1))} />
        {value.substr(-1)}
      </span>
    );
  }
}

export class StatsSection extends React.Component {
  tmStatsPromise;
  editsStatsPromise;
  constructor(props) {
    super(props);
    this.state = {
      buildings: 0,
      roads: 0,
      edits: 0,
      communityMappers: 0,
      mappersOnline: 0,
    };
  }

  componentDidMount() {
    this.getTMStats();
    this.getEditsStats();
  }

  componentWillUnmount() {
    this.tmStatsPromise && this.tmStatsPromise.cancel();
    this.editsStatsPromise && this.editsStatsPromise.cancel();
  }

  getTMStats = event => {
    this.tmStatsPromise = cancelablePromise(fetchLocalJSONAPI('system/statistics/'));
    this.tmStatsPromise.promise
      .then(r => {
        this.setState({
          mappersOnline: r.mappersOnline,
          communityMappers: r.totalMappers,
        });
      })
      .catch(e => console.log(e));
  };

  getEditsStats = event => {
    this.editsStatsPromise = cancelablePromise(fetchExternalJSONAPI(EDITS_API_URL));
    this.editsStatsPromise.promise
      .then(r => {
        this.setState({
          edits: r.edits,
          buildings: r.buildings,
          roads: r.roads,
        });
      })
      .catch(e => console.log(e));
  };

  renderStatsCol(label, value, priority = false) {
    return (
      <div className={`fl tc w-20-l w-third dib-l ${priority ? '' : 'dn'}`}>
        <div className="db f1 fw8 red barlow-condensed">
          <StatsNumber value={value} />
        </div>
        <div className="db blue-grey">
          <FormattedMessage {...label} />
        </div>
      </div>
    );
  }
  render() {
    return (
      <div className="cf pv5 ph5-l ph4 bg-white">
        {this.renderStatsCol(messages.buildingsStats, this.state.buildings, true)}
        {this.renderStatsCol(messages.roadsStats, this.state.roads, true)}
        {this.renderStatsCol(messages.editsStats, this.state.edits)}
        {this.renderStatsCol(messages.communityStats, this.state.communityMappers, true)}
        {this.renderStatsCol(messages.mappersStats, this.state.mappersOnline)}
      </div>
    );
  }
}
