import React from "react";

import './css/Header.scss';

export default function Header(props) {
    const {task} = props;
    return (
         <div className="header level">
            <div className="level-left">
                <div className="level-item"><h2 className="title is-3">Task View</h2></div>
                <div className="level-item has-text-centered">
                    <div>
                        <p className="heading">project #</p><p className="title is-4">{ task.project_id }</p>
                    </div>
                </div>
                <div className="level-item has-text-centered">
                    <div>
                        <p className="heading">task #</p><p className="title is-4">{ task.task_id }</p>
                    </div>
                </div>
                <div className="level-item has-text-centered">
                    <div>
                        <p className="heading">difficulty</p><p className="title is-4">{ task.difficulty }</p>
                    </div>
                </div>
            </div>
            <div className="level-right">
                <div className="level-item">
                    <a href={`https://tm.nsosm.com/project/${task.project_id }#task/${task.task_id}`}>tasking manager page</a>
                </div>
            </div>
        </div>
    )
}
