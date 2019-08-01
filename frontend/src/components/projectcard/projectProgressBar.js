import React from "react";
import { FormattedMessage } from "react-intl";
import messages from "./messages"

export default function ProjectProgressBar({ percentMapped, percentValidated }: Object) {
    /* tooltip component credit: https://codepen.io/syndicatefx/pen/QVPbJg */
    return   (<> 
    <div className="cf db">
      <div className="relative">
        <div className={`absolute bg-blue-grey br-pill hhalf hide-child ${tachyonsWidthClass(percentMapped)}`} >

        </div>
        <div className={`absolute bg-red br-pill hhalf hide-child ${tachyonsWidthClass(percentValidated)}`} >
          <span className="db absolute top-2 z-1 w3 w4-m w4-l bg-black ba br2 b--blue-dark pa2 shadow-5 child">
          <p className="f6 lh-copy near-black ma0 white f7 fw4"> <span className="fw8">{percentValidated}%</span> <FormattedMessage {...messages["percentValidated"]} /></p>
          <span className="absolute top-0 left-2 nt2 w1 h1 bg-black bl bt b--blue-dark rotate-45"></span>
          </span>
        </div>
        <div className={`bg-grey-light br-pill hhalf hide-child overflow-y-hidden`}>
          <span className="db absolute top-2 z-1 w3 w4-m w4-l bg-black ba br2 b--moon-gray pa2 shadow-5 child">
          <p className="f6 lh-copy near-black ma0 white f7 fw4"> <span className="fw8">{percentMapped}%</span> <FormattedMessage {...messages["percentMapped"]} /></p>
          <span className="absolute top-0 center-2 nt2 w1 h1 bg-black bl bt b--moon-gray rotate-45"></span>
          </span>
        </div>
    </div>
  </div>
  </>);
  }
  

function tachyonsWidthClass(percent: Number) {
    const tachyonsWidths =  [
      {
        className: "",
        value: 0},

      {
         className: "w-10",
         value: 5},
      {
         className: "w-10",
         value: 10},
 {
         className: "w-20",
         value: 20},
 {
         className: "w-25",
         value: 25},
 {
         className: "w-30",
         value: 30},
 {       
         className: "w-33",
         value: 33},
 {
         className: "w-third",
         value: 33},
 {
         className: "w-34",
         value: 34},
 {
         className: "w-40",
         value: 40},
 {
         className: "w-50",
         value: 50},
 {
         className: "w-60",
         value: 60},
 {
         className: "w-two-thirds",
         value: 66},
 {
         className: "w-75",
         value: 75},
 {
         className: "w-80",
         value: 80},
 {
         className: "w-90",
         value: 90},
 {
         className: "w-100",
         value: 100
 }];
 
     return tachyonsWidths.slice().reverse().find((a) => a.value <= percent ).className
 }
 