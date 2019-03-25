import { bbox } from '@turf/turf';

import {MAP_COLORS, CONNECTED_NODE_RADIUS, NON_FB_OPACITY} from './mapcolor';

mapboxgl.accessToken = 'pk.eyJ1Ijoid29uZ2EwMCIsImEiOiJtRHBVSzNFIn0.ahHP2ZkCYqNmJcSweouMMg';


// mapbox renderings
function makeMapboxPointLayer(name, source) {
    return {
        "id": name,
        "type": "circle",
        "source": source,
        "paint": {
            "circle-color": MAP_COLORS.connected_node.toString(),
            "circle-radius": CONNECTED_NODE_RADIUS
        }
    }
}

function makeMapboxLineLayer(name, source) {
    return {
        "id": name,
        "type": "line",
        "source": source,
        "layout": {
            "line-join": "round",
            "line-cap": "round"
        },
        "paint": {
            "line-color": [
                'match',
                ['get', 'highway'],
                'tertiary', MAP_COLORS.tertiary.toString(),
                'unclassified', MAP_COLORS.unclassified.toString(),
                'residential', MAP_COLORS.residential.toString(),
                'service', MAP_COLORS.service.toString(),
                'track', MAP_COLORS.track.toString(),
                MAP_COLORS.unknown.toString()
            ],
            "line-width": 4,
            // "line-opacity": 0.2,
            "line-opacity": [
                'match',
                ['get', 'is_fb'],
                1, 1,
                0, NON_FB_OPACITY,
                1
            ]
        }
    };
}


export function VectorMap(container, args) {
    var self = {},
        _onLoad = args.onLoad,
        loaded = false,
        onFeatureSelected = args.onFeatureSelected,
        onFeatureHovered = args.onFeatureHovered;

    // setup mapbox
    var mapbox = new mapboxgl.Map({
        container: container,
        style: 'mapbox://styles/wonga00/cjnqm64ur169g2rmm2ctvkpzn',
        center: [102.2385676, 13.6371702],
        zoom: 15,
        hash: false,
        preserveDrawingBuffer: true
    });

    var styleBackgroundLayers = [];
    mapbox.on('load', function () {
        // remember all the style background layer names
        styleBackgroundLayers = Object.keys(mapbox.style._layers);

        mapbox.addSource('lines', {
            "type": "geojson",
            "data": {"type": "FeatureCollection", "features": []}
        });
        mapbox.addSource('points', {
            "type": "geojson",
            "data": {"type": "FeatureCollection", "features": []}
        });
        mapbox.addSource('taskBounds', {
            "type": "geojson",
            "data": {"type": "FeatureCollection", "features": []}
        });

        mapbox.addSource('DigitalGlobePremium', {
            "type": "raster",
            "tiles": [
                'https://a.tiles.mapbox.com/v4/digitalglobe.316c9a2e/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ2c2dzFlMWgyd2x0ZHdmMDB6NzYifQ.9Pl3XOO82ArX94fHV289Pg',
                'https://b.tiles.mapbox.com/v4/digitalglobe.316c9a2e/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ2c2dzFlMWgyd2x0ZHdmMDB6NzYifQ.9Pl3XOO82ArX94fHV289Pg',
                'https://c.tiles.mapbox.com/v4/digitalglobe.316c9a2e/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ2c2dzFlMWgyd2x0ZHdmMDB6NzYifQ.9Pl3XOO82ArX94fHV289Pg',
                'https://d.tiles.mapbox.com/v4/digitalglobe.316c9a2e/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ2c2dzFlMWgyd2x0ZHdmMDB6NzYifQ.9Pl3XOO82ArX94fHV289Pg'
            ],
            "tilesize": 256
        });
        mapbox.addSource('DigitalGlobeStandard', {
            'type': 'raster',
            'tiles': [
                'https://a.tiles.mapbox.com/v4/digitalglobe.0a8e44ba/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ3pjczNpaHYycXFyMGo0djY3N2IifQ.90uebT4-ow1uqZKTUrf6RQ',
                'https://b.tiles.mapbox.com/v4/digitalglobe.0a8e44ba/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ3pjczNpaHYycXFyMGo0djY3N2IifQ.90uebT4-ow1uqZKTUrf6RQ',
                'https://c.tiles.mapbox.com/v4/digitalglobe.0a8e44ba/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ3pjczNpaHYycXFyMGo0djY3N2IifQ.90uebT4-ow1uqZKTUrf6RQ',
                'https://d.tiles.mapbox.com/v4/digitalglobe.0a8e44ba/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqZGFrZ3pjczNpaHYycXFyMGo0djY3N2IifQ.90uebT4-ow1uqZKTUrf6RQ'
            ],
            'tilesize': 256
        });

        // hide one of these layers
        mapbox.addLayer({
            "id": "DigitalGlobePremium",
            "source": "DigitalGlobePremium",
            "type": "raster"
        });
        mapbox.addLayer({
            "id": "DigitalGlobeStandard",
            "source": "DigitalGlobeStandard",
            "type": "raster"
        });
        mapbox.addLayer({
            id: 'darkgrey',
            type: 'background',
            paint: { 'background-color': '#222' }
        });
        mapbox.addLayer({
            id: 'taskBounds',
            type: 'line',
            source: 'taskBounds',
            "layout": {
                "line-join": "miter",
                "line-cap": "round"
            },
            "paint": {
                "line-opacity": 0.3,
                "line-color": "#FB6850",
                "line-width": 10,
            }
        });
        mapbox.addLayer({
            id: 'hoverLine',
            type: "line",
            "source": 'lines',
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": {
                "line-opacity": 0.3,
                "line-color": "#FB6850",
                "line-width": 18,
                "line-blur": 4
            },
            "filter": ["==", ["get", "id"], 0]
        });
        mapbox.addLayer({
            id: 'selectedLine',
            type: "line",
            "source": 'lines',
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": {
                "line-opacity": 0.7,
                "line-color": "#FB6850",
                "line-width": 18,
                "line-blur": 4
            },
            "filter": ["==", ["get", "id"], 0]
        });
        mapbox.addLayer(makeMapboxLineLayer('edit', 'lines'));
        mapbox.addLayer(makeMapboxPointLayer('edit-points', 'points'));

        self.setBackground('darkgrey');

        var selectedFeature;

        function findFeature(point, layer) {
            const MOUSE_BUFFER = 5;
            var bbox = [[point.x - MOUSE_BUFFER, point.y - MOUSE_BUFFER], [point.x + MOUSE_BUFFER, point.y + MOUSE_BUFFER]];
            var features = mapbox.queryRenderedFeatures(bbox, {layers: [layer]});
            return features.find(f => f.geometry.type !== 'Point');
        }

        mapbox.on("mousemove", function(e) {
            var feature = findFeature(e.point, 'edit');
            mapbox.getCanvas().style.cursor = feature ? 'pointer' : '';
            if (feature) {
                if (onFeatureHovered) {
                    onFeatureHovered(feature);
                }
                mapbox.setFilter('hoverLine', ['==', ['get', 'id'], feature.properties.id]);
            } else {
                mapbox.setFilter('hoverLine', ['==', ['get', 'id'], 0]);
                if (onFeatureHovered) {
                    onFeatureHovered(null);
                }
            }
        });

        mapbox.on('click', function(e) {
            var feature = findFeature(e.point, 'edit');
            if (feature && (!selectedFeature || feature.properties.id != selectedFeature.properties.id)) {
                selectedFeature = feature;
                if (onFeatureSelected) {
                    onFeatureSelected(feature);
                }
                mapbox.setFilter('selectedLine', ['==', ['get', 'id'], feature.properties.id]);
            } else {
                selectedFeature = null;
                if (onFeatureSelected) {
                    onFeatureSelected(null);
                }
                mapbox.setFilter('selectedLine', ['==', ['get', 'id'], 0]);
            }
        });

        loaded = true;
        if (_onLoad) {
            _onLoad();
        }

    });

    self.onLoad = function(fn) {
        _onLoad = fn;
        if (loaded) {
            _onLoad();
        }
    };

    self.setTaskBounds = function(data) {
        mapbox.getSource('taskBounds').setData(data);
    };

    self.setData = function(data, opt) {
        opt = opt || {};
        mapbox.getSource('lines').setData(data);
        var pointData = {
            type: 'FeatureCollection',
            features: data.features.filter(f => f.geometry.type === 'Point')
        }
        mapbox.getSource('points').setData(pointData);

        if (opt.centered) {
            var fbData = {
                type: 'FeatureCollection',
                features: data.features.filter(f => f.properties.is_fb)
            };
            var bounds = bbox(fbData);
            mapbox.fitBounds(bounds, {
                padding: 20,
                animate: false
            })
        }
    };

    self.showVectorLayer = function() {
        mapbox.setLayoutProperty('edit', 'visibility', 'visible');
        mapbox.setLayoutProperty('diff', 'visibility', 'none');
    };

    self.showLayer = function(layer, on) {
        var visibility = on ? 'visible' : 'none';
        if (layer === 'diff') {
            mapbox.setLayoutProperty('diff', 'visibility', visibility);
        } else if (layer === 'vector') {
            ['edit', 'edit-points', 'hoverLine', 'selectedLine'].forEach(l => {
                mapbox.setLayoutProperty(l, 'visibility', visibility);
            });
        }
    }

    self.showImageLayer = function() {
        mapbox.setLayoutProperty('diff', 'visibility', 'visible');
        mapbox.setLayoutProperty('edit', 'visibility', 'none');
    };

    var backgroundLayers = [
        'DigitalGlobeStandard', 'DigitalGlobePremium', 'darkgrey'];

    self.addImage = function(url, coords) {
        var src = mapbox.getSource('diff');
        if (!src) {
            mapbox.addSource('diff', {
                "type": "image",
                "url": url,
                "coordinates": coords
            });
        } else {
            src.updateImage({
                url: url,
                coordinates: coords
             });
         }

        if (!mapbox.getLayer('diff')) {
            mapbox.addLayer({
                'id': 'diff',
                'source': 'diff',
                'type': 'raster',
                'paint': {
                    'raster-opacity': 1
                }
            }, 'edit');
        }
    }

    function setBackground(background) {
        backgroundLayers.forEach(layer => {
            if (layer != background) {
                mapbox.setLayoutProperty(layer, 'visibility', 'none');
            } else {
                mapbox.setLayoutProperty(layer, 'visibility', 'visible');
            }
        });

        var styleBackgroundOn = (background === 'darkvector');
        styleBackgroundLayers.forEach(layer => {
            if (styleBackgroundOn) {
                mapbox.setLayoutProperty(layer, 'visibility', 'visible');
            } else {
                mapbox.setLayoutProperty(layer, 'visibility', 'none');
            }
        });
    };

    self.isLoaded = function() {
        return loaded;
    };

    self.setBackground =setBackground;
    self.mapbox = mapbox;

    return self;
}
