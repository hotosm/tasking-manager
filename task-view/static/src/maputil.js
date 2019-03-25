// fits the fb features to the width x height and margin
var osmtogeojson = require('osmtogeojson');


export function getPixel(img, i, j) {
    return [
        img.data[((img.width * j) + i) * 4],
        img.data[((img.width * j) + i) * 4 + 1],
        img.data[((img.width * j) + i) * 4 + 2],
        img.data[((img.width * j) + i) * 4 + 3]
    ];
}

export function getProjection(data, width, height, margin) {
    var fbData = {
        type: 'FeatureCollection',
        features: data.features.filter(f => f.properties.is_fb)
    };

    var projection = d3.geoMercator()
      .fitExtent([[margin, margin], [width - margin, height - margin]], fbData);

    return projection;
}

function getConnectedNodes(xml) {
    // we'll just get the nodes that are interesting and convert them
    // to geojson and add them in
    var nodes = xml.getElementsByTagName('node');
    var nodeLUT = {};
    var i, j;
    for (i = 0; i < nodes.length; i++) {
        nodeLUT[nodes[i].getAttribute('id')] = 0;
    }

    function hasTag(el, tag) {
        var tags = el.getElementsByTagName('tag');
        for (let i = 0; i < tags.length; i++) {
            if (tags[i].getAttribute('k') === tag) {
                return true;
            }
        }
        return false;
    }

    var ways = xml.getElementsByTagName('way');
    for (i = 0; i < ways.length; i++) {
        if (hasTag(ways[i], 'building')) {
            continue;
        }
        var nds = ways[i].getElementsByTagName('nd');
        for (j = 0; j < nds.length; j++) {
            nodeLUT[nds[j].getAttribute('ref')] += 1;
        }
    }

    var out = [];
    function nodeToFeature(node, numConnections) {
        return {
            type: 'Feature',
            properties: {
                connections:numConnections
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    parseFloat(node.getAttribute('lon')),
                    parseFloat(node.getAttribute('lat'))
                ]

            }
        }
    }

    for (var i = 0; i < nodes.length; i++) {
        var numConnections = nodeLUT[nodes[i].getAttribute('id')];
        if (numConnections > 1) {
            out.push(nodeToFeature(nodes[i], numConnections));
        }
    }

    return out;
}

export function fbXMLtoGeoJSON(xml) {
    // converts an xml piece into geojson for rendering


    // process the data so that it is easier to render
    // label nodes as connecting
    // label ways as fb

    function fbId(value) {
        if (typeof(value) === "number") {
            return value;
        }
        var tokens = value.split('/');
        if (tokens.length == 1) {
            return parseInt(tokens[0]);
        }
        return parseInt(tokens[1]);
    }

    // convert xml to basic geojson
    var data = osmtogeojson(xml);

    // move the tags to the properties level so that it is recognizable
    // by mapbox styling

    data.features.forEach((f) => {

        f.properties.is_fb = Number(fbId(f.properties.id) < 0);

        if (f.properties.tags) {
            f.properties.highway = f.properties.tags.highway;
        }
    });

    // filter out non connecting nodes
    data.features = data.features.filter((f) => {
        if (f.properties.building) {
            return false;
        }
        if (f.geometry.type === 'Point' && !(f.properties.connections > 2)) {
            return false;
        }
        return true;
    });

    // attach addition nodes as features since osmtogeojson ignores those nodes
    var connectedNodes = getConnectedNodes(xml);
    data.features = data.features.concat(connectedNodes);

    return data;
}
