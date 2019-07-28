import React from "react";
import { Link } from "@reach/router";

export default ({ partial=true, ...props}) => (
  <Link
    {...props}
    getProps={({isCurrent, isPartiallyCurrent }) => {
      const isActive = partial
        ? isPartiallyCurrent
        : isCurrent;
      const activeStyle = isActive ? {
          backgroundColor:  "#2c3038"
        } : {};
      return {
        style: activeStyle
      };
    }}
  />
);
