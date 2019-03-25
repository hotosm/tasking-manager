import React from "react";
import classNames from 'classnames';

export default function Buttons(props) {
    return (
        <div className="buttons has-addons">
            { props.options.map((o, idx) => {
                var classes = classNames('button', 'is-small', {'is-link': props.selected === o});
                return (<a className={classes} key={idx} onClick={(v) => props.onChange(o)}>{o}</a>);
            })}
        </div>
    )
}
