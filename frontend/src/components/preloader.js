import React from 'react';

export function Preloader() {
  return (
    <div className="fixed vh-100 w-100 flex justify-center items-center bg-white">
      <div className="br-100 red h3 w3" style={{ animation: 'spin 1s linear infinite' }}></div>
    </div>
  );
}
