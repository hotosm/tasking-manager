import React from 'react';
import { connect } from 'react-redux';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';

import messages from './messages';
import { TasksMap } from './map.js';
import { PriorityBox } from '../projectcard/projectCard';
import { TaskSelectionFooter } from './footer';
import { cancelablePromise } from '../../utils/promise';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';


class TaskSelection extends React.Component {
  getProjectTasksPromise;
  state = {
    activeSection: 'tasks',
    tasks: {},
  };

  componentDidMount() {
    if (this.props.project.projectId) {
      this.getProjectTasks();
    }
  }
  componentDidUpdate(prevProps) {
    if (this.props.project.projectId && this.props.project.projectId !== prevProps.project.projectId) {
      this.getProjectTasks();
    }
  }
  getProjectTasks = event => {
    this.getProjectTasksPromise = cancelablePromise(
      fetchLocalJSONAPI(`projects/${this.props.project.projectId}/tasks/`)
    );
    this.getProjectTasksPromise.promise
      .then(data => this.setState({tasks: data}))
      .catch(e => console.log(e));
  }
  renderHeaderLine() {
    const userLink = (
      <Link to={`/users/${this.props.project.author}`} className="link blue-dark underline">
        {this.props.project.author}
      </Link>
    );
    return (
      <div className="cf">
        <div className="w-70 dib fl">
          <span className="blue-light">#{this.props.project.projectId}</span>
          <span className="blue-dark">
            {' '}
            | <FormattedMessage {...messages.createBy} values={{ user: userLink }} />
          </span>
        </div>
        <div className="mw4 dib fr">
          <PriorityBox priority={this.props.project.projectPriority} extraClasses={'pv2 ph3'} />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className="cf pv3">
          <div className="w-100 w-60-ns fl">
            <div className="ph4">
              <ReactPlaceholder
                showLoadingAnimation={true}
                rows={3}
                delay={500}
                ready={typeof(this.props.project.projectId) === 'number' && this.props.project.projectId > 0}
              >
                {this.renderHeaderLine()}
                <div className="cf pb3">
                  <h3 className="f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
                    {this.props.project.projectInfo && this.props.project.projectInfo.name}
                  </h3>
                  <span className="blue-light">{this.props.project.campaignTag} &#183; Brazil</span>
                </div>
                <div className="cf">
                  <div className="cf ttu barlow-condensed f4 pv2">
                    <span
                      className={`mr4 pb2 pointer ${this.state.activeSection === 'tasks' && 'bb b--blue-dark'}`}
                      onClick={() => this.setState({activeSection: 'tasks'})}
                    >
                      <FormattedMessage {...messages.tasks} />
                    </span>
                    <span
                      className={`mr4 pb2 pointer ${this.state.activeSection === 'instructions' && 'bb b--blue-dark'}`}
                      onClick={() => this.setState({activeSection: 'instructions'})}
                    >
                      <FormattedMessage {...messages.instructions} />
                    </span>
                  </div>
                </div>
              </ReactPlaceholder>
            </div>
          </div>
          <div className="w-100 w-40-ns fl">
            <TasksMap mapResults={this.state.tasks} projectId={this.props.project.projectId} type={this.props.type} className="dib w-100 fl"/>
          </div>
        </div>
        <div className="cf ph4 bt b--grey-light">
          <ReactPlaceholder
            showLoadingAnimation={true}
            rows={3}
            delay={500}
            ready={typeof(this.props.project.projectId) === 'number' && this.props.project.projectId >0}
          >
            <TaskSelectionFooter
              type={this.props.type}
              mappingTypes={this.props.project.mappingTypes}
              imagery={this.props.project.imagery}
              editors={this.props.project.mappingEditors}
              defaultUserEditor={this.props.userPreferences.default_editor}
            />
          </ReactPlaceholder>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  userPreferences: state.preferences,
  username: state.auth.getIn(['userDetails', 'username']),
});

TaskSelection = connect(
  mapStateToProps
)(TaskSelection);
export { TaskSelection };
