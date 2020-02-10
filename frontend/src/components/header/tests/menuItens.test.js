import { getMenuItensForUser } from '../index';

it('test menuItems for unlogged user', () => {
  const userDetails = {};
  const menuItems = getMenuItensForUser(userDetails).map(i => i.link);
  expect(menuItems).toEqual(['explore']);
  // disable learn and about while the content is rewritten
  // expect(menuItems).toEqual(['explore', 'learn', 'about']);
});

it('test menuItems for logged non admin user', () => {
  const userDetails = { username: 'test', role: 'MAPPER' };
  const menuItems = getMenuItensForUser(userDetails).map(i => i.link);
  expect(menuItems).toEqual(['explore', 'contributions']);
  // disable learn and about while the content is rewritten
  // expect(menuItems).toEqual(['explore', 'contributions', 'learn', 'about']);
});

it('test menuItems for logged admin user', () => {
  const userDetails = { username: 'test', role: 'ADMIN' };
  const menuItems = getMenuItensForUser(userDetails).map(i => i.link);
  expect(menuItems).toEqual(['explore', 'contributions', 'manage']);
  // disable learn and about while the content is rewritten
  // expect(menuItems).toEqual(['explore', 'contributions', 'manage', 'learn', 'about']);
});

it('test menuItems for logged project manager user', () => {
  const userDetails = { username: 'test', role: 'PROJECT_MANAGER' };
  const menuItems = getMenuItensForUser(userDetails).map(i => i.link);
  expect(menuItems).toEqual(['explore', 'contributions', 'manage']);
  // disable learn and about while the content is rewritten
  // expect(menuItems).toEqual(['explore', 'contributions', 'manage', 'learn', 'about']);
});
