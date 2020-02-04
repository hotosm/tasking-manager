import { getMenuItensForUser } from '../index';

it('test menuItems for unlogged user', () => {
  const userDetails = {};
  const menuItems = getMenuItensForUser(userDetails).map(i => i.link);
  expect(menuItems).toEqual(['explore', 'learn', 'about']);
});

it('test menuItems for logged non admin user', () => {
  const userDetails = { username: 'test', role: 'MAPPER' };
  const menuItems = getMenuItensForUser(userDetails).map(i => i.link);
  expect(menuItems).toEqual(['explore', '/users/test', 'learn', 'about']);
});

it('test menuItems for logged admin user', () => {
  const userDetails = { username: 'test', role: 'ADMIN' };
  const menuItems = getMenuItensForUser(userDetails).map(i => i.link);
  expect(menuItems).toEqual(['explore', '/users/test', 'manage', 'learn', 'about']);
});

it('test menuItems for logged project manager user', () => {
  const userDetails = { username: 'test', role: 'PROJECT_MANAGER' };
  const menuItems = getMenuItensForUser(userDetails).map(i => i.link);
  expect(menuItems).toEqual(['explore', '/users/test', 'manage', 'learn', 'about']);
});
