import React from 'react';
import Popup from 'reactjs-popup';
import { detectWebGLContext } from '../../utils/webglCheck';
export const WebglErrorModal = () => {
  const isWebGlSupported = !detectWebGLContext() ? (
    <Popup modal open closeOnEscape={false} closeOnDocumentClick={false}>
      {(close) => (
        <div style={{ margin: '0 auto', textAlign: 'center' }}>
          <p className={`red mw7 mh5 f3`}>
            Your browser doesn't support WebGL, so the maps can't be loaded, please update to the
            latest version to use the maps.
          </p>
          <button className={`pv2 ph3 bg-red white f5 br2`} onClick={close}>
            Close modal
          </button>
        </div>
      )}
    </Popup>
  ) : null;
  return isWebGlSupported;
};
