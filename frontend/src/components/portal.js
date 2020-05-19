import React from 'react';
import ReactDOM from 'react-dom';

const PORTAL_ROOT = document.getElementById('action-root');

class Portal extends React.Component {
  constructor(props) {
    super(props);
    this.el = document.createElement('div');
  }

  componentDidMount() {
    PORTAL_ROOT.style.display = 'block';
    PORTAL_ROOT.appendChild(this.el);
  }

  componentWillUnmount() {
    PORTAL_ROOT.style.display = 'none';
    PORTAL_ROOT.removeChild(this.el);
  }

  render() {
    return ReactDOM.createPortal(this.props.children, this.el);
  }
}

export default Portal;
