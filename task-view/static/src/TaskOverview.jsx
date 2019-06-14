import React from "react";
import './css/TaskOverview.scss';
import TaskEditGraph from './TaskEditGraph';

const timeFormat = d3.timeFormat('%b %d %Y');
const timeDeltaFormat = sec => new Date(sec * 1000).toISOString().substr(11, 8);

function duration(seconds) {
    let hours = parseInt((seconds / 3600) % 24);
    let minutes = parseInt((seconds / 60) % 60);

    let out = '';
    if (hours) {
        out += `${hours} hrs`;
    }
    if (minutes) {
        out += ` ${minutes} min`;
    }
    return out;
}

function niceName(name) {
  return name.split('_').join(' ');
}

function TaskCell({date, task_id, project}) {
  return (
    <div className="task-cell">
      <h2 className="is-2">{niceName(project)}</h2>
      <h3><span>#{task_id}</span>{timeFormat(date)}</h3>
    </div>
  );
}

export class TaskOverview extends React.Component {
  constructor() {
    super();
    this.state = {
      data: []
    };
  }

  componentDidMount() {
    const { serverPrefix } = this.props.config;
    d3.json(`${serverPrefix}/longest_tasks`).then(data => {
        console.log(data);
        data.forEach(d => {
            d.date = new Date(d.date);
        });

        this.setState({data: data});
    });
  }

  renderRows() {
    const { serverPrefix } = this.props.config;
    var { data } = this.state;

    return data.map((d, i) => {
      return (
        <tr key={i}>
        <td><TaskCell date={d.date} task_id={d.task_id} project={d.project_name} /></td>
        <td><TaskEditGraph edits={d.edit_data} /></td>
        <td>{ duration( d.total_time) }</td>
        <td><a href={`${serverPrefix}/task/${d.task_osm}`}>view</a></td>
        </tr>
      );
    });
  }

  render() {
    return (
      <div className="container task-overview">
          <div className="section">
              <h1 className="title is-1">Longish Edits of the last week</h1>
              <table className="table">
                  <thead>
                      <tr>
                        <th>Task</th>
                        <th>Edits</th>
                        <th>Edit Duration</th>
                        <th></th>
                      </tr>
                  </thead>
                  <tbody>
                    { this.renderRows() }
                  </tbody>
              </table>
           </div>
      </div>
    );
  }
}
