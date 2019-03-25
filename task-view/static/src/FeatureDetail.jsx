import React from "react";

import './css/FeatureDetail.scss';

export default function FeatureDetail(props) {
    const { feature } = props;

    var data = [];
    if (feature) {
        // data.push(['id', feature.properties.id]);
        // data.push(['type', feature.properties.type]);
        var propertyKeys = Object.keys(feature.properties);
        propertyKeys.sort();

        propertyKeys.forEach(k => {
            data.push([k, feature.properties[k]]);
        })
        // where did the tags go?
        // if (feature.properties.tags) {
        //     var tags = JSON.parse(feature.properties.tags);
        //     Object.keys(tags).forEach(k => {
        //         data.push([k, tags[k]]);
        //     });
        // }
    }

    if (feature) {
        return (
            <div className="selected-feature">
                <table className="table is-striped is-bordered">
                    <tbody>
                        { data.map(d => ( <tr key={d[0]}><td>{d[0]}</td><td>{d[1]}</td></tr> )) }
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="selected-feature">
            <div className="unimportant no-data-mesg">none selected</div>
        </div>
    );
}
