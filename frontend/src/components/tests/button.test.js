import React from 'react';
import TestRenderer from 'react-test-renderer';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '../button';


it('children and onClick props of Button', () => {
  let testVar;
  const testButton = TestRenderer.create(
    <Button className="btn-secondary" onClick={() => testVar=true}>Test it</Button>
  );
  const buttonInstance = testButton.root;
  expect(
    buttonInstance.findByProps({'className': 'btn-secondary btn'}).children
  ).toEqual(["Test it"]);

  buttonInstance.findByProps({'className': 'btn-secondary btn'}).props.onClick();
  expect(testVar).toEqual(true);
});

it('icon prop of Button', () => {
  const testButton = TestRenderer.create(
    <Button className="btn-secondary" icon={faExternalLinkAlt}>
      Test it
    </Button>
  );
  const buttonInstance = testButton.root;
  expect(
    buttonInstance.findByProps({'className': 'btn-secondary btn'}).children[1].props.icon
  ).toEqual(faExternalLinkAlt);
});
