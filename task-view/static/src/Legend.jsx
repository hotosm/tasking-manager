import React from "react";
import { roadColor, DIFF_COLORS } from './mapcolor';

import './css/Legend.scss';


const roads = [
    'tertiary',
    'unclassified',
    'residential',
    'service',
    'track',
    'other'
];
var diffLegend = [
    'road added',
    'road removed',
    'classification changed',
    'unchanged'
];

function roadSymbol(roadType) {
    return (
        <tr key={roadType}>
            <td><div className="road" style={{background: roadColor(roadType)}}></div></td>
            <td>{roadType}</td>
        </tr>
    )
}

function diffSymbol(diffType) {
    var diffType = diffType.split(' ').pop();
    return (
        <tr key={diffType}>
            <td><div className="road" style={{background: DIFF_COLORS[diffType]}}></div></td>
            <td>{diffType}</td>
        </tr>
    );
}

export default function Legend(props) {
    return (
        <div className="legend columns">
            <div className="column">
                <p className="has-text-weight-bold">Revision</p>
                <table className="table revision-legend">
                    <tbody>
                        { roads.map(roadSymbol) }
                        <tr>
                            <td><div className="node"></div></td>
                            <td>unconnected node</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="column">
                <p className="has-text-weight-bold">Diff</p>
                <table className="table diff-legend">
                    <tbody>
                        { diffLegend.map(diffSymbol) }
                    </tbody>
                </table>
            </div>
        </div>
    );
}
