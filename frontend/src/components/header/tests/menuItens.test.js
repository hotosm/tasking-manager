import { getMenuItensForUser } from '../index';
import { SERVICE_DESK } from '../../../config';

it('test menuItems for unlogged user', () => {
  const userDetails = {};
  const menuItems = ['explore', 'learn/map', 'about'];
  if (SERVICE_DESK) menuItems.push(SERVICE_DESK);
  expect(getMenuItensForUser(userDetails, []).map((i) => i.link)).toEqual(menuItems);
});

it('test menuItems for logged non admin user', () => {
  const userDetails = { username: 'test', role: 'MAPPER' };
  const menuItems = ['explore', 'contributions', 'learn/map', 'about'];
  if (SERVICE_DESK) menuItems.push(SERVICE_DESK);
  expect(getMenuItensForUser(userDetails, []).map((i) => i.link)).toEqual(menuItems);
});

it('test menuItems for logged non admin user, but org manager', () => {
  const userDetails = { username: 'test', role: 'MAPPER' };
  const menuItems = ['explore', 'contributions', 'manage', 'learn/map', 'about'];
  if (SERVICE_DESK) menuItems.push(SERVICE_DESK);
  expect(getMenuItensForUser(userDetails, [1, 3, 4]).map((i) => i.link)).toEqual(menuItems);
});

it('test menuItems for logged admin user', () => {
  const userDetails = { username: 'test', role: 'ADMIN' };
  const menuItems = ['explore', 'contributions', 'manage', 'learn/map', 'about'];
  if (SERVICE_DESK) menuItems.push(SERVICE_DESK);
  expect(getMenuItensForUser(userDetails, []).map((i) => i.link)).toEqual(menuItems);
});
