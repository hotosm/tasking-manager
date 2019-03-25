import React from "react";
import { VectorMap } from './vectormap.js';

export default class ReactVectorMap extends React.Component {
    componentDidMount() {
        const { onFeatureSelected, onFeatureHovered } = this.props;
        var args = {...this.props};
        args.onLoad = () => {

            if (this.props.background) {
                this.vectorMap.setBackground(this.props.background);
            }
            if (this.props.data) {
                // probably just do this if we have never set data before
                this.vectorMap.setData(this.props.data, {centered: true});
            }
            if (this.props.taskBounds) {
                this.vectorMap.setTaskBounds(this.props.taskBounds);
            }
            if (this.props.image) {
                this.vectorMap.addImage(this.props.image, this.props.imageCoords);
            }
            this.vectorMap.showLayer('vector', this.props.showVector === true);
            this.vectorMap.showLayer('diff', this.props.showImage === true);
        }

        this.vectorMap = new VectorMap(this.mapContainer, args);
    }

    componentDidUpdate(prevProps, prevState) {
        if (!this.vectorMap.isLoaded()) {
            return;
        }
        if (prevProps.background !== this.props.background) {
            this.vectorMap.setBackground(this.props.background);
        }

        // todo better diff here
        if (prevProps.data !== this.props.data) {
            this.vectorMap.setData(this.props.data);
        }
        if (JSON.stringify(prevProps.taskBounds) !== JSON.stringify(this.props.taskBounds)) {
            this.vectorMap.setTaskBounds(this.props.taskBounds);
        }
        if (prevProps.image != this.props.image) {
            this.vectorMap.addImage(this.props.image, this.props.imageCoords);
        }
        if (prevProps.showVector != this.props.showVector) {
            this.vectorMap.showLayer('vector', this.props.showVector === true);
        }
        if (prevProps.showImage != this.props.showImage) {
            this.vectorMap.showLayer('diff', this.props.showImage === true);
        }
    }

    render() {
        return (
          <div id="vector-map" ref={el => this.mapContainer = el} />
        );
    }
}
