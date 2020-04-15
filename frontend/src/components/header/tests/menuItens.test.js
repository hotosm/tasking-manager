import { getMenuItensForUser } from '../index';

it('test menuItems for unlogged user', () => {
  const userDetails = {};
  const menuItems = getMenuItensForUser(userDetails, []).map((i) => i.link);
  expect(menuItems).toEqual(['explore', 'learn', 'about']);
});

it('test menuItems for logged non admin user', () => {
  const userDetails = { username: 'test', role: 'MAPPER' };
  const menuItems = getMenuItensForUser(userDetails, []).map((i) => i.link);
  expect(menuItems).toEqual(['explore', 'contributions', 'learn', 'about']);
});

it('test menuItems for logged non admin user, but org manager', () => {
  const userDetails = { username: 'test', role: 'MAPPER' };
  const menuItems = getMenuItensForUser(userDetails, [1, 3, 4]).map((i) => i.link);
  expect(menuItems).toEqual(['explore', 'contributions', 'manage', 'learn', 'about']);
});

it('test menuItems for logged admin user', () => {
  const userDetails = { username: 'test', role: 'ADMIN' };
  const menuItems = getMenuItensForUser(userDetails, []).map((i) => i.link);
  expect(menuItems).toEqual(['explore', 'contributions', 'manage', 'learn', 'about']);
});
