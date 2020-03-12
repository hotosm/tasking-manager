import React from 'react';

export function Preloader() {
  const containerClasses = 'fixed vh-100 w-100 flex justify-center items-center';
  const spinnerClasses = 'preloader br-100 ba';
  return (
    <div className={containerClasses}>
      <div
        className={spinnerClasses}
        style={{
          width: "40px",
          height: "40px",
          borderWidth: "3px",
          borderColor: '#f3f3f3 #d73f3f',
          animation: 'spin 1s linear infinite',
        }}
      ></div>
    </div>
  );
}
