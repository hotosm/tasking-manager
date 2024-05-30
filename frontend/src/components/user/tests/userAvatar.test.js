import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { UserAvatar, UserAvatarList } from '../avatar';
import { CloseIcon } from '../../svgIcons';
import { MemoryRouter } from 'react-router-dom';

describe('UserAvatar', () => {
  it('with picture url and default size', () => {
    let element;
    act(() => {
      element = TestRenderer.create(
        <MemoryRouter>
          <UserAvatar username={'Mary'} picture={'http://image.xyz/photo.jpg'} colorClasses="red" />
        </MemoryRouter>,
      );
    });
    const elementInstance = element.root;
    expect(elementInstance.findByProps({ title: 'Mary' }).type).toBe('div');
    expect(elementInstance.findByProps({ title: 'Mary' }).props.style.backgroundImage).toBe(
      'url("http://image.xyz/photo.jpg")',
    );
    expect(elementInstance.findByProps({ title: 'Mary' }).props.className).toBe(
      'dib mh1 br-100 tc v-mid cover red user-picture-medium f5',
    );
  });

  it('with picture url and large size', () => {
    let element;
    act(() => {
      element = TestRenderer.create(
        <MemoryRouter>
          <UserAvatar
            username={'Mary'}
            colorClasses="orange"
            size="large"
            picture={'http://image.xyz/photo2.jpg'}
          />
        </MemoryRouter>,
      );
    });
    const elementInstance = element.root;
    expect(elementInstance.findByProps({ title: 'Mary' }).props.style.backgroundImage).toBe(
      'url("http://image.xyz/photo2.jpg")',
    );
    expect(elementInstance.findByProps({ title: 'Mary' }).props.className).toBe(
      'dib mh1 br-100 tc v-mid cover orange h3 w3 f2',
    );
  });

  it('without picture url and with large size', () => {
    let element;
    act(() => {
      element = TestRenderer.create(
        <MemoryRouter>
          <UserAvatar username={'Mary'} size="large" colorClasses="white bg-red" />
        </MemoryRouter>,
      );
    });
    const elementInstance = element.root;
    expect(elementInstance.findByType('div').props.className).toBe(
      'dib mh1 br-100 tc v-mid cover white bg-red h3 w3 f2',
    );
    expect(elementInstance.findByType('span').props.children).toContain('M');
    expect(elementInstance.findByType('span').props.style).toStrictEqual({
      paddingTop: '0.625rem',
    });
  });

  it('with name with default size', () => {
    let element;
    act(() => {
      element = TestRenderer.create(
        <MemoryRouter>
          <UserAvatar username={'Mary'} name={'Mary Poppins'} colorClasses="white bg-red" />
        </MemoryRouter>,
      );
    });
    const elementInstance = element.root;
    expect(elementInstance.findByType('div').props.className).toBe(
      'dib mh1 br-100 tc v-mid cover white bg-red user-picture-medium f5',
    );
    expect(elementInstance.findByType('span').props.children).toContain('MP');
    expect(elementInstance.findByType('span').props.style).toStrictEqual({
      paddingTop: '0.375rem',
    });
  });

  it('with more than 3 words name', () => {
    let element;
    act(() => {
      element = TestRenderer.create(
        <MemoryRouter>
          <UserAvatar
            username={'Mary'}
            name={'Mary Poppins Long Name'}
            colorClasses="white bg-red"
          />
        </MemoryRouter>,
      );
    });
    const elementInstance = element.root;
    expect(elementInstance.findByType('span').props.children).toContain('MPL');
  });

  it('with username containing space', () => {
    let element;
    act(() => {
      element = TestRenderer.create(
        <MemoryRouter>
          <UserAvatar username={'Mary Poppins Long Name'} colorClasses="white bg-red" />
        </MemoryRouter>,
      );
    });
    const elementInstance = element.root;
    expect(elementInstance.findByType('span').props.children).toContain('MPL');
    expect(() => elementInstance.findByType(CloseIcon)).toThrow(
      new Error('No instances found with node type: "CloseIcon"'),
    );
  });

  it('with editMode TRUE but without removeFn has NOT a CloseIcon', () => {
    let element;
    act(() => {
      element = TestRenderer.create(
        <MemoryRouter>
          <UserAvatar
            username={'Mary Poppins Long Name'}
            colorClasses="white bg-red"
            editMode={true}
          />
        </MemoryRouter>,
      );
    });
    const elementInstance = element.root;
    expect(elementInstance.findByType('span').props.children).toContain('MPL');
    expect(() => elementInstance.findByType(CloseIcon)).toThrow(
      new Error('No instances found with node type: "CloseIcon"'),
    );
  });

  it('with removeFn, but with editMode FALSE  has NOT a CloseIcon', () => {
    let element;
    act(() => {
      element = TestRenderer.create(
        <MemoryRouter>
          <UserAvatar
            username={'Mary Poppins Long Name'}
            colorClasses="white bg-red"
            removeFn={() => console.log('no')}
          />
        </MemoryRouter>,
      );
    });
    const elementInstance = element.root;
    expect(elementInstance.findByType('span').props.children).toContain('MPL');
    expect(() => elementInstance.findByType(CloseIcon)).toThrow(
      new Error('No instances found with node type: "CloseIcon"'),
    );
  });

  it('with removeFn and editMode TRUE has a CloseIcon', () => {
    let value = 0;
    const element = TestRenderer.create(
      <MemoryRouter>
        <UserAvatar
          username={'Mary'}
          colorClasses="white bg-red"
          removeFn={() => (value = 1)}
          editMode={true}
        />
      </MemoryRouter>,
    );
    const elementInstance = element.root;
    expect(element.toJSON().type).toBe('div');
    expect(() => elementInstance.findByType(CloseIcon)).not.toThrow(
      new Error('No instances found with node type: "CloseIcon"'),
    );

    elementInstance
      .findByProps({ className: 'relative top-0 z-1 fr br-100 f7 tc h1 w1 bg-red white pointer' })
      .props.onClick();
    expect(value).toBe(1);
  });

  it('without disableLink prop has a link', () => {
    const element = TestRenderer.create(
      <MemoryRouter>
        <UserAvatar username={'jean'} colorClasses="white bg-red" />
      </MemoryRouter>,
    );
    const elementInstance = element.root;

    expect(element.toJSON().type).toBe('a');
    expect(elementInstance.findByType('a').props.href).toBe('/users/jean');
  });

  it('without disableLink, but with editMode prop, has a link', () => {
    const element = TestRenderer.create(
      <MemoryRouter>
        <UserAvatar username={'jean'} colorClasses="white bg-red" editMode={true} />
      </MemoryRouter>,
    );
    const elementInstance = element.root;

    expect(element.toJSON().type).toBe('a');
    expect(elementInstance.findByType('a').props.href).toBe('/users/jean');
  });

  it('without disableLink, but with removeFn prop, has a link', () => {
    const element = TestRenderer.create(
      <MemoryRouter>
        <UserAvatar username={'jean'} colorClasses="white bg-red" removeFn={() => 123} />
      </MemoryRouter>,
    );
    const elementInstance = element.root;

    expect(element.toJSON().type).toBe('a');
    expect(elementInstance.findByType('a').props.href).toBe('/users/jean');
  });

  it('with disableLink prop has not a link', () => {
    const element = TestRenderer.create(
      <MemoryRouter>
        <UserAvatar username={'jean'} colorClasses="white bg-red" disableLink={true} />
      </MemoryRouter>,
    );
    const json_element = element.toJSON();
    expect(json_element.type).toBe('div');
    expect(json_element.props.title).toBe('jean');
  });
});

describe('UserAvatarList', () => {
  const users = [
    { username: 'sun' },
    { username: 'earth' },
    { username: 'superuser' },
    { username: 'moon' },
    { username: 'conte' },
    { username: 'star' },
    { username: 'user' },
    { username: 'osmuser' },
  ];
  it('large size, with a defined bgColor and without maxLength', () => {
    let element;
    act(() => {
      element = TestRenderer.create(
        <MemoryRouter>
          <UserAvatarList users={users} bgColor="bg-red" size="large" />
        </MemoryRouter>,
      );
    });
    const elementInstance = element.root;
    expect(elementInstance.findAllByType(UserAvatar).length).toBe(users.length);
    expect(elementInstance.findAllByType(UserAvatar)[0].props.colorClasses).toBe('white bg-red');
    expect(elementInstance.findAllByProps({ className: 'dib' }).length).toBe(users.length);
    expect(elementInstance.findAllByProps({ className: 'dib' })[0].props.style).toStrictEqual({
      marginLeft: '',
    });
    expect(elementInstance.findAllByProps({ className: 'dib' })[1].props.style).toStrictEqual({
      marginLeft: '-1.5rem',
    });
    expect(elementInstance.findAllByType(UserAvatar)[0].props.size).toBe('large');
  });
  it('small size, with a defined bgColor and textColor', () => {
    let element;
    act(() => {
      element = TestRenderer.create(
        <MemoryRouter>
          <UserAvatarList users={users} bgColor="bg-white" textColor="black" size="small" />
        </MemoryRouter>,
      );
    });
    const elementInstance = element.root;
    expect(elementInstance.findAllByType(UserAvatar).length).toBe(users.length);
    expect(elementInstance.findAllByType(UserAvatar)[0].props.size).toBe('small');
    expect(elementInstance.findAllByType(UserAvatar)[0].props.colorClasses).toBe('black bg-white');
    expect(elementInstance.findAllByProps({ className: 'dib' })[1].props.style).toStrictEqual({
      marginLeft: '-0.875rem',
    });
  });
  it('default size, without bgColor and with maxLength = 5', () => {
    const element = TestRenderer.create(
      <MemoryRouter>
        <UserAvatarList users={users} maxLength={5} />
      </MemoryRouter>,
    );
    const elementInstance = element.root;
    expect(elementInstance.findAllByType(UserAvatar).length).toBe(6);
    expect(elementInstance.findAllByType(UserAvatar)[0].props.size).toBe(undefined);
    expect(elementInstance.findAllByProps({ className: 'dib' })[1].props.style).toStrictEqual({
      marginLeft: '-1.25rem',
    });
    expect(() => elementInstance.findByProps({ number: '+3' })).not.toThrow(
      new Error('No instances found with props: {"name": "+3"}'),
    );
    expect(elementInstance.findByProps({ number: '+3' }).props.colorClasses).toBe(
      'blue-dark bg-grey-light',
    );
    expect(
      elementInstance.findByProps({ colorClasses: 'blue-dark bg-grey-light' }).props.number,
    ).toBe('+3');
  });
  it('with more than 999 users not shown render +999 as label', () => {
    const element = TestRenderer.create(
      <MemoryRouter>
        <UserAvatarList
          users={[...Array(1020).keys()].map((i) => ({ username: `user_${i}` }))}
          maxLength={15}
        />
      </MemoryRouter>,
    );
    const elementInstance = element.root;
    expect(elementInstance.findAllByType(UserAvatar).length).toBe(16);
    expect(() => elementInstance.findByProps({ number: '+999' })).not.toThrow(
      new Error('No instances found with props: {"name": "+999"}'),
    );
    expect(elementInstance.findByProps({ number: '+999' }).props.colorClasses).toBe(
      'blue-dark bg-grey-light',
    );
    expect(
      elementInstance.findByProps({ colorClasses: 'blue-dark bg-grey-light' }).props.number,
    ).toBe('+999');
  });
});
