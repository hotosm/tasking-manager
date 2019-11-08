import React from 'react';

export const SwitchToggle = ({ label, isChecked, onChange }: Object) => (
  <div className="fr pv2 dib-ns dn">
    <div className="flex items-center justify-center bg-grey-dark">
      {label && <span className="di mr2 nowrap f6 blue-dark dn-m">{label}</span>}
      <div className="relative dib">
        <input
          className="absolute z-5 w-100 h-100 o-0 pointer checkbox"
          type="checkbox"
          checked={isChecked}
          onChange={onChange}
        />
        <div className="relative z-4 dib w3 h2 bg-blue-grey overflow-hidden br4 v-mid bg-animate checkbox-wrapper">
          <div className="absolute right-auto left-0 w2 h2 br4 bg-white ba b-grey-light shadow-4 t-cb bg-animate checkbox-toggle"></div>
        </div>
      </div>
    </div>
  </div>
);
