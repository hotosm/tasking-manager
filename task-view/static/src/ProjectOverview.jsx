import {interpolateRdYlGn} from 'd3-scale-chromatic';
import './css/project-overview.scss';
import { buffer, bbox, bboxPolygon, polygon, multiPolygon } from '@turf/turf';
import classNames from 'classnames';

import React from "react";
import ReactDOM from "react-dom";
import Buttons from './Buttons';

mapboxgl.accessToken = 'pk.eyJ1Ijoid29uZ2EwMCIsImEiOiJtRHBVSzNFIn0.ahHP2ZkCYqNmJcSweouMMg';

const styles = new Map([
    ['dark', 'mapbox://styles/wonga00/cjnqm64ur169g2rmm2ctvkpzn'],
    ['digital globe standard', {
        "version": 8,
        "sources": {
            "raster-tiles": {
                "type": "raster",
                'tiles': [
                    'https://a.tiles.mapbox.com/v4/digitalglobe.0a8e44ba/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ3pjczNpaHYycXFyMGo0djY3N2IifQ.90uebT4-ow1uqZKTUrf6RQ',
                    'https://b.tiles.mapbox.com/v4/digitalglobe.0a8e44ba/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ3pjczNpaHYycXFyMGo0djY3N2IifQ.90uebT4-ow1uqZKTUrf6RQ',
                    'https://c.tiles.mapbox.com/v4/digitalglobe.0a8e44ba/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ3pjczNpaHYycXFyMGo0djY3N2IifQ.90uebT4-ow1uqZKTUrf6RQ',
                    'https://d.tiles.mapbox.com/v4/digitalglobe.0a8e44ba/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ3pjczNpaHYycXFyMGo0djY3N2IifQ.90uebT4-ow1uqZKTUrf6RQ'
                ],
                "tileSize": 256
            }
        },
        "layers": [{
            "id": "simple-tiles",
            "type": "raster",
            "source": "raster-tiles",
            "minzoom": 0,
            "maxzoom": 22,
            "paint": {
                "raster-saturation": -0.8,
                "raster-brightness-max": 0.8
            }
        }]
    }],
    ['digital globe premium', {
        "version": 8,
        "sources": {
            "raster-tiles": {
                "type": "raster",
                'tiles': [
                    'https://a.tiles.mapbox.com/v4/digitalglobe.316c9a2e/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ2c2dzFlMWgyd2x0ZHdmMDB6NzYifQ.9Pl3XOO82ArX94fHV289Pg',
                    'https://b.tiles.mapbox.com/v4/digitalglobe.316c9a2e/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ2c2dzFlMWgyd2x0ZHdmMDB6NzYifQ.9Pl3XOO82ArX94fHV289Pg',
                    'https://c.tiles.mapbox.com/v4/digitalglobe.316c9a2e/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ2c2dzFlMWgyd2x0ZHdmMDB6NzYifQ.9Pl3XOO82ArX94fHV289Pg',
                    'https://d.tiles.mapbox.com/v4/digitalglobe.316c9a2e/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ2c2dzFlMWgyd2x0ZHdmMDB6NzYifQ.9Pl3XOO82ArX94fHV289Pg'
                ],
                "tileSize": 256
            }
        },
        "layers": [{
            "id": "simple-tiles",
            "type": "raster",
            "source": "raster-tiles",
            "minzoom": 0,
            "maxzoom": 22
        }]
    }]
]);

const DigitalGlobePremium = {
    "version": 8,
    "sources": {
        "raster-tiles": {
            "type": "raster",
            'tiles': [
                'https://a.tiles.mapbox.com/v4/digitalglobe.316c9a2e/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ2c2dzFlMWgyd2x0ZHdmMDB6NzYifQ.9Pl3XOO82ArX94fHV289Pg',
                'https://b.tiles.mapbox.com/v4/digitalglobe.316c9a2e/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ2c2dzFlMWgyd2x0ZHdmMDB6NzYifQ.9Pl3XOO82ArX94fHV289Pg',
                'https://c.tiles.mapbox.com/v4/digitalglobe.316c9a2e/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ2c2dzFlMWgyd2x0ZHdmMDB6NzYifQ.9Pl3XOO82ArX94fHV289Pg',
                'https://d.tiles.mapbox.com/v4/digitalglobe.316c9a2e/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ2c2dzFlMWgyd2x0ZHdmMDB6NzYifQ.9Pl3XOO82ArX94fHV289Pg'
            ],
            "tileSize": 256
        }
    },
    "layers": [{
        "id": "simple-tiles",
        "type": "raster",
        "source": "raster-tiles",
        "minzoom": 0,
        "maxzoom": 22
    }]
};

function getDomain(metric) {
    if (metric === 'total_time') {
        return [28800, 0];
    } else if (metric == 'difficulty') {
        return [4, 0];
    } else {
        // ways added?
        return [300, 0];
    }
}

const EMPTY_FEATURES = {"type": "FeatureCollection", "features": []};

const PAINT_PROPERTIES = {
    'total_time': [
          "interpolate",
          ["linear"],
          ["get", "total_time"],
          0,
          "hsl(181, 72%, 83%)",
          12300,
          "hsl(354, 100%, 44%)"
      ],
    'new_ways_count': [
          "interpolate",
          ["linear"],
          ["get", "new_ways_count"],
          0,
          "hsl(185, 83%, 85%)",
          366,
          "hsl(0, 100%, 56%)"
      ],
    'difficulty': [
      "case",
      [
        "==",
        ["get", "difficulty"],
        0
      ],
      "hsl(0, 0%, 81%)",
      [
        "match",
        ["get", "difficulty"],
        [0, 1],
        true,
        false
      ],
      "hsl(104, 55%, 80%)",
      [
        "match",
        ["get", "difficulty"],
        [0, 2],
        true,
        false
      ],
      "hsl(44, 79%, 67%)",
      [
        "match",
        ["get", "difficulty"],
        [0, 3],
        true,
        false
      ],
      "hsl(0, 81%, 56%)",
      "#000000"
    ]
}

function Tooltip(props) {
    var style;
    if (props.position) {
        style = {left: props.position.x + 14, top: props.position.y + 14};
    } else {
        style = {left: 0, top: 0};
    }
    style['display'] = props.feature ? 'block' : 'none';

    var content = (<div></div>);
    if (props.feature) {
        content = (
            <div>
                Difficulty: {props.feature.difficulty}<br />
                Total Time: {props.feature.total_time}<br />
                New Ways: {props.feature.new_ways_count}<br />
                Task Id: {props.feature.task_id}<br />
                Project Id: {props.feature.project_id}<br />

            </div>
        )
    }
    return (
        <div id="tooltip" style={style}>
            { content }
        </div>
    )
}

class ProjectMap extends React.Component {
    constructor() {
        super();
        this.state = {
            tooltipData: null
        };
    }

    componentDidMount() {
        // setup mapbox
        const project_id = this.props.project_id;

        this.mapbox = new mapboxgl.Map({
            container: this.mapContainer,
            style: styles.get('digital globe standard'),
            center: [102.2385676, 13.6371702],
            zoom: 15,
            hash: true,
            preserveDrawingBuffer: true
        });

        this.mapbox.on('load', () => {
            // this.mapbox.addLayer({
            //     id: 'darkgrey',
            //     type: 'background',
            //     paint: { 'background-color': 'rgba(0, 0, 0, 0.6)' }
            // });

            // this.mapbox.addSource('tasks', {
            //     "type": "geojson",
            //     "data": EMPTY_FEATURES
            // });

            this.mapbox.addSource('project-boundary', {
                "type": "geojson",
                "data": EMPTY_FEATURES
            });

            this.mapbox.addSource('projects', {
                "type": "geojson",
                "data": EMPTY_FEATURES
            });

            this.mapbox.addLayer({
                id: 'task-tiles',
                type: 'fill',
                'source': {
                    type: 'vector',
                    url: 'mapbox://wonga00.7reu3t4j'
                },
                "source-layer": "tasks-b3lz0j",
                'paint': {
                    'fill-color': PAINT_PROPERTIES[this.props.metric],
                    'fill-opacity': 0.5
                }
            });

            this.mapbox.addLayer({
                id: 'task-tile-lines',
                type: 'line',
                'source': {
                    type: 'vector',
                    url: 'mapbox://wonga00.7reu3t4j'
                },
                "source-layer": "tasks-b3lz0j",
                'paint': {
                    'line-color': '#ccc',
                    'line-opacity': 0.8,
                    'line-width': 0.5
                }
            });

            this.mapbox.addLayer({
                id: 'hoverLine',
                type: "line",
                'source': {
                    type: 'vector',
                    url: 'mapbox://wonga00.7reu3t4j'
                },
                "source-layer": "tasks-b3lz0j",
                "paint": {
                    "line-opacity": 1,
                    "line-color": PAINT_PROPERTIES[this.props.metric],
                    "line-width": 4
                },
                "filter": ["==", ["get", "unique_key"], 0]
            });

            this.mapbox.addLayer({
                id: 'projects',
                type: "line",
                "source": "projects",
                "paint": {
                    "line-opacity": 0.8,
                    "line-color": ['get', 'color'],
                    "line-width": 2,
                }
            });

            this.showLayer('projects', this.props.showProjects);

            this.mapbox.on("mousemove", (e) => {
                var features = this.mapbox.queryRenderedFeatures(e.point, {layers: ['task-tiles']});
                this.mapbox.getCanvas().style.cursor = features.length ? 'pointer' : '';
                if (features.length) {
                    this.setState({tooltipData: features[0].properties, tooltipPos: e.point});
                    this.mapbox.setFilter('hoverLine', ['==', ['get', 'unique_key'], features[0].properties.unique_key]);
                } else {
                    this.setState({tooltipData: null});
                    this.mapbox.setFilter('hoverLine', ['==', ['get', 'unique_key'], 0]);
                }
            });
            this.mapbox.on("click", (e) => {
                var features = this.mapbox.queryRenderedFeatures(e.point, {layers: ['task-tiles']});
                if (features.length) {
                    this.props.onTaskClick(features[0].properties.xml_path);
                }
            });

            d3.json('/static/data/projects_thailand.json', (error, data) => {
                console.log('project areas', data);
                // put some random colors
                var c = d3.scaleOrdinal(d3.schemeCategory10).domain([0, 10]);
                data.features.forEach(f => {
                    f.properties.color = c(f.properties.project_id % 10);
                })
                this.mapbox.getSource('projects').setData(data);
                var bounds = bbox(data);
                this.mapbox.fitBounds(bounds, {
                    padding: 20,
                    animate: false
                })
            })
        });
    }

    showLayer(layer, on) {
        if (on) {
            this.mapbox.setLayoutProperty(layer, 'visibility', 'visible');
        } else {
            this.mapbox.setLayoutProperty(layer, 'visibility', 'none');
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.showProjects !== this.props.showProjects) {
            this.showLayer('projects', this.props.showProjects)
        }
        if (prevProps.metric !== this.props.metric) {
            this.mapbox.setPaintProperty('task-tiles', 'fill-color', PAINT_PROPERTIES[this.props.metric]);
            this.mapbox.setPaintProperty('hoverLine', 'line-color', PAINT_PROPERTIES[this.props.metric]);
        }

    }

    showGrid(geojson) {
        // preprocess the data and set the
        var rainbow = d3.scaleSequential(interpolateRdYlGn).domain([28800, 0]);

        geojson.features.forEach(f => {
            f.properties.color = rainbow(f.properties.total_time);
        });
        // var multi = multiPolygon(geojson.features.map(f => f.geometry.coordinates[0]));
        // var boundary = buffer(multi, 1, {units: 'miles'});
        // this.mapbox.getSource('project-boundary').setData(boundary);

        this.mapbox.getSource('tasks').setData(geojson);

        var bounds = bbox(geojson);
        this.mapbox.fitBounds(bounds, {
            padding: 20,
            animate: false
        })
        this.mapbox.addLayer({
            id: 'gridFill',
            type: "fill",
            "source": "tasks",
            "paint": {
                "fill-opacity": [
                    "interpolate",
                    ["exponential", 0.5],
                    ["zoom"],
                    12, 0.7,
                    14, 0.1
                ],
                "fill-color": ['get', 'color']
            }
        });

        this.mapbox.addLayer({
            id: 'grid',
            type: "line",
            "source": "tasks",
            "paint": {
                "line-opacity": 0.8,
                "line-color": ['get', 'color'],
                "line-width": 1,
            }
        });

        this.mapbox.addLayer({
            id: 'hoverLine',
            type: "line",
            "source": "tasks",
            "paint": {
                "line-opacity": 1,
                "line-color": ['get', 'color'],
                "line-width": 2
            },
            "filter": ["==", ["get", "unique_key"], 0]
        });

        this.mapbox.addLayer({
            id: 'project-boundary',
            type: "line",
            "source": "project-boundary",
            "paint": {
                "line-opacity": 0.8,
                "line-color": "#FFE24C",
                "line-width": 2,
            }
        });

        this.mapbox.on("mousemove", (e) => {
            var features = this.mapbox.queryRenderedFeatures(e.point, {layers: ['gridFill']});
            this.mapbox.getCanvas().style.cursor = features.length ? 'pointer' : '';
            if (features.length) {
                console.log(features[0].properties);
                this.setState({tooltipData: features[0].properties, tooltipPos: e.point});
                this.mapbox.setFilter('hoverLine', ['==', ['get', 'unique_key'], features[0].properties.unique_key]);
            } else {
                this.setState({tooltipData: null});
                this.mapbox.setFilter('hoverLine', ['==', ['get', 'unique_key'], 0]);
            }
        });

    }

    render() {
        return (
            <div ref={el => this.mapContainer = el} className="map-container">
                <Tooltip feature={this.state.tooltipData} position={this.state.tooltipPos} />
            </div>
        )
    }
}

export class ProjectOverview extends React.Component {
    constructor() {
        super();
        this.state = {
            metric: 'new_ways_count',
            background: 'DigitalGlobePremium',
            tasks: [1, 2, 3, 4, 5],
            showProjects: false
        }

        this.onMetricChange = this.onMetricChange.bind(this);
        this.handleBackgroundChange = this.handleBackgroundChange.bind(this);
        this.toggleProjectLayer = this.toggleProjectLayer.bind(this);
        this.openTask = this.openTask.bind(this);
    }

    onMetricChange(value) {
        this.setState({
            metric: value
        });
    }
    handleBackgroundChange(event) {
        this.setState({background: event.target.value});
    }
    toggleProjectLayer() {
        this.setState((prevState) => {
            return {
                showProjects: !prevState.showProjects
            };
        });
    }

    openTask(xmlPath) {
        var url = `${this.props.config.serverPrefix}/task/${xmlPath}`;
        window.open(url, '_blank');
    }

    render() {
        const {background } = this.state;
        const options = Array.from(styles.keys());
        return (
            <div className="fullscreen-container" id="project-overview">
                <div className="header level">
                   <div className="level-left">
                       <div className="level-item"><h2 className="title is-3">All Tasks</h2></div>
                       <div className="level-item has-text-centered">
                           <div>
                               {/* <p className="heading">project #</p><p className="title is-4">{ task.project_id }</p> */}
                           </div>
                       </div>
                       <div className="level-item has-text-centered">
                           <div>
                               {/* <p className="heading">task #</p><p className="title is-4">{ task.task_id }</p> */}
                           </div>
                       </div>
                       <div className="level-item has-text-centered">
                           <div>
                               {/* <p className="heading">difficulty</p><p className="title is-4">{ task.difficulty }</p> */}
                           </div>
                       </div>
                   </div>
               </div>
                <div className="sidepane">
                    <h2>task list</h2>
                </div>
                <div className="main">
                    <div className="main-header">
                        <div className="columns is-vcentered">
                            <div className="column">
                                <div className="inline-buttons">
                                    <Buttons options={['total_time', 'difficulty', 'new_ways_count']} selected={this.state.metric} onChange={this.onMetricChange}/>
                                </div>
                                <div className={classNames('button', 'is-small', {'is-link': this.state.showProjects})} onClick={this.toggleProjectLayer}>show projects</div>
                                {/* <label>background:</label>
                                <div className="select">
                                    <select value={background} onChange={this.handleBackgroundChange}>
                                        <option value="darkgrey">dark grey</option>
                                        <option value="DigitalGlobePremium">Digital Globe Premium</option>
                                        <option value="DigitalGlobeStandard">Digital Globe Standard</option>
                                        <option value="darkvector">mapbox digital style</option>
                                    </select>
                                </div> */}
                            </div>
                        </div>
                    </div>
                    <div className="main-content">
                        <ProjectMap
                            metric={this.state.metric}
                            background={this.state.background}
                            showProjects={this.state.showProjects}
                            onTaskClick={this.openTask}/>
                    </div>
                </div>
            </div>
        )
    }
}
