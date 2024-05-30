import React from 'react';
import ReactDOM from 'react-dom';

let portalRoot = document.getElementById('action-root');
if (!portalRoot) {
  portalRoot = document.createElement('div');
  portalRoot.setAttribute('id', 'action-root');
  document.body.appendChild(portalRoot);
}

class Portal extends React.Component {
  el = document.createElement('div');

  componentDidMount() {
    portalRoot.style.display = 'block';
    portalRoot.appendChild(this.el);
  }

  componentWillUnmount() {
    portalRoot.style.display = 'none';
    portalRoot.removeChild(this.el);
  }

  render() {
    return ReactDOM.createPortal(this.props.children, this.el);
  }
}

export default Portal;
