import React from 'react';
import { FormattedMessage } from 'react-intl';

import { createComponentWithIntl } from '../../../utils/testWithIntl';
import { UserPermissionErrorContent } from '../permissionErrorModal';
import { CloseIcon } from '../../svgIcons';
import { Button } from '../../button';

describe('test if UserPermissionErrorContent', () => {
  const project = {
    mappingPermission: 'LEVEL',
    percentMapped: 11,
    percentValidated: 1,
    percentBadImagery: 0,
  };
  let value = false;
  const closeTestFn = v => (value = v);
  const element = createComponentWithIntl(
    <UserPermissionErrorContent
      project={project}
      userLevel="BEGINNER"
      close={() => closeTestFn(true)}
    />,
  );
  const testInstance = element.root;
  it('has a span with a CloseIcon as children', () => {
    expect(
      testInstance.findByProps({ className: 'fr relative blue-light pt1 link pointer' }).type,
    ).toBe('span');
    expect(
      testInstance.findByProps({ className: 'fr relative blue-light pt1 link pointer' }).props
        .children.type,
    ).toStrictEqual(CloseIcon);
  });
  it('when clicking on the CloseIcon parent element, executes the closeTestFn', () => {
    expect(value).toBeFalsy();
    testInstance
      .findByProps({ className: 'fr relative blue-light pt1 link pointer' })
      .props.onClick();
    expect(value).toBeTruthy();
  });
  it('has a red Button', () => {
    expect(testInstance.findByType(Button).props.className).toBe('white bg-red');
  });
  it('has a Button with a correct FormattedMessage', () => {
    expect(testInstance.findByType(Button).props.children.type).toBe(FormattedMessage);
    expect(testInstance.findByType(Button).props.children.props.id).toBe(
      'project.selectTask.footer.button.selectAnotherProject',
    );
  });
  it('has a h3 with a correct FormattedMessage', () => {
    expect(testInstance.findByType('h3').props.children.type).toBe(FormattedMessage);
    expect(testInstance.findByType('h3').props.children.props.id).toBe(
      'project.permissions.error.title',
    );
  });
});
