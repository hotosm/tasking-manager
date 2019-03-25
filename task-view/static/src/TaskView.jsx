import './css/TaskView.scss';
import './css/Thumb.scss';

import React from "react";
import Header from './Header';
import Legend from './Legend';
import Buttons from './Buttons';
import FeatureDetail from './FeatureDetail';
import ReactVectorMap from './ReactVectorMap';
import classNames from 'classnames';
import { fbXMLtoGeoJSON, getProjection } from './maputil';
import { StaticMap } from './staticmap';
import { MapDiff } from './mapdiff';

const timeFormat = d3.timeFormat('%m/%d/%Y %I:%M');;

function Thumb(props) {
    return (
        <div className={"thumb " + (props.selected ? 'selected': '')} onClick={props.onClick}>
            <img src={props.showDiff ? props.diff : props.image } />
            <div className='caption' onClick={props.onClick}>
                <div className="index">{props.version}</div>
                <div className="role">{props.role}</div>
                <div className="upload_time">{timeFormat(props.timestamp)}</div>
            </div>
        </div>
    );
}

function createEdits(versions) {
    var parser = new DOMParser();
    versions.forEach(edit => edit.data = fbXMLtoGeoJSON(parser.parseFromString(edit.data, 'text/xml')));
    var v1 = versions[0].data;

    var width = 180;
    var height = 180;
    var margin = 5;

    var d = document.createElement('div');

    // this should actually use the window
    var projection = getProjection(v1, width, height, margin);
    var coords = [
        projection.invert([0, 0]),
        projection.invert([width, 0]),
        projection.invert([width, height]),
        projection.invert([0, height]),
    ];

    var s = StaticMap(d, 180, 180, projection);
    var mapdiff = MapDiff(180, 180, projection)

    var edits = versions.map((v, idx) => {
        s.render(v.data);
        var prev = idx == 0 ? v : versions[idx - 1];
        return {
            version: idx,
            role: v.role,
            id: v.upload_id,
            timestamp: new Date(v.upload_time),
            image: s.getImageUrl(),
            diff: mapdiff.diff(prev.data, v.data, false),
            data: v.data,
            imageCoords: coords
        }
    });
    console.log('edits', edits);
    return edits;
}

function Button(props) {
    return (
        <a className={classNames('button', 'is-small', {'is-link': props.selected}, props.className)} onClick={props.onClick}>{props.children}</a>
    )
}

function EditStats(props) {
    const { edit } = props;

    return (
        <div className={classNames(props.className)}>
            <div style={{display: (edit.timestamp) ? 'block': 'none'}}>
                <span className="version tag">{`v${edit.version}`}</span>
                <span className="role tag">{edit.role}</span>
                <span className="timestamp is-pulled-right">{timeFormat(edit.timestamp)}</span>
            </div>
        </div>
    );
}

export class TaskView extends React.Component {

    constructor() {
        super();
        this.state = {
            task: {
                project_id: 30,
                task_id: 53,
                difficulty: 2
            },
            background: 'DigitalGlobePremium',
            edits: [],
            thumbImageType: 'revision',
            showImage: false,
            showVector: true
        }
        this.handleBackgroundChange = this.handleBackgroundChange.bind(this);
        this.handleEditChange = this.handleEditChange.bind(this);
        this.toggleState = this.toggleState.bind(this);
    }

    componentDidMount() {
        var edits = createEdits(this.props.edits);
        this.setState({
            edits: edits,
            selectedEdit: 0
        })
    }

    handleEditChange(editIdx) {
        this.setState({
            selectedEdit: editIdx
        })
    }

    handleBackgroundChange(event) {
        this.setState({background: event.target.value});
    }

    toggleState(key) {
        this.setState((prevState) => {
            var state = {};
            state[key] = !prevState[key];
            return state;
        })
    }

    render() {
        const {task} = this.props;
        const {edits, selectedEdit, selectedFeature,
            thumbImageType, hoveredFeature, background,
            taskBounds, showVector, showImage} = this.state;
        var currentEdit = edits.length ? edits[selectedEdit] : {};

        return (
            <div className="fullscreen-container">
                <Header task={task} />
                <div className="sidepane">
                    <div className="sidepane-header">
                        <span>History</span>
                        <div className="button-container is-pulled-right">
                            <Buttons options={['revision', 'diffs']} selected={thumbImageType} onChange={(v) => this.setState({thumbImageType: v})}/>
                        </div>
                    </div>
                    <div className="sidepane-content">
                        {edits.map((e, idx) => (<Thumb {...e} key={idx} showDiff={thumbImageType === 'diffs'} selected={idx == selectedEdit} onClick={() => this.handleEditChange(idx)}/>))}
                    </div>
                </div>
                <div className="main">
                    <div className="main-header">
                        <div className="columns is-vcentered">
                            <EditStats className="column" edit={currentEdit} />
                            <div className="column">
                                <div className="inline-buttons">
                                    <div className="buttons">
                                        <Button selected={showVector} onClick={() => this.toggleState('showVector')}>revision</Button>
                                        <Button selected={showImage} onClick={() => this.toggleState('showImage')}>diff</Button>
                                    </div>
                                </div>
                                <label>background:</label>
                                <div className="select">
                                    <select value={background} onChange={this.handleBackgroundChange}>
                                        <option value="darkgrey">dark grey</option>
                                        <option value="DigitalGlobePremium">Digital Globe Premium</option>
                                        <option value="DigitalGlobeStandard">Digital Globe Standard</option>
                                        <option value="darkvector">mapbox digital style</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="main-content">
                        <ReactVectorMap
                            onFeatureSelected={(f) => {this.setState({selectedFeature: f})}}
                            onFeatureHovered={(f) => {this.setState({hoveredFeature: f})}}
                            background={background}
                            taskBounds={task.geometry}
                            data={currentEdit.data}
                            image={currentEdit.diff}
                            imageCoords={currentEdit.imageCoords}
                            showVector={showVector}
                            showImage={showImage} />
                        <div className="infopanel">
                            <h2 className="panel-section-title">Legend</h2>
                            <div className="section">
                                <Legend />
                            </div>
                            <h2 className="panel-section-title">feature detail</h2>
                            <div className="section">
                                <FeatureDetail feature={selectedFeature || hoveredFeature} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
