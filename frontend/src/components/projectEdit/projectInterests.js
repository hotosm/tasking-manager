import React from 'react';
import { InterestsList } from '../formInputs';

export const ProjectInterests = ({ interests, projectInterests, setProjectInfo }) => {
  const ids = projectInterests.map((i) => i.id);
  const projectSelected = interests.map((i) => {
    let selected = false;
    if (ids.includes(i.id)) {
      selected = true;
    }
    return { ...i, selected: selected };
  });

  const changeSelect = (id) => {
    const index = projectSelected.findIndex((i) => i.id === id);

    const copy = projectSelected.map((interest, idx) => {
      if (idx === index) {
        interest.selected = !interest.selected;
      }
      return interest;
    });

    const newProjectInterests = copy.filter((i) => i.selected === true);
    newProjectInterests.map((i) => delete i.selected);

    setProjectInfo((p) => {
      return { ...p, interests: newProjectInterests };
    });
  };

  return (
    <InterestsList interests={projectSelected} field={'selected'} changeSelect={changeSelect} />
  );
};
