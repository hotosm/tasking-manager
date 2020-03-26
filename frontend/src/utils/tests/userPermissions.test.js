import { isUserAdminOrPM } from '../userPermissions';
describe('user', () => {
  it('with ADMIN role should return TRUE', () => {
    expect(isUserAdminOrPM('ADMIN')).toBeTruthy();
  });
  it('with MAPPER role should return False', () => {
    expect(isUserAdminOrPM('MAPPER')).toBeFalsy();
  });
  it('with READ_ONLY role should return False', () => {
    expect(isUserAdminOrPM('READ_ONLY')).toBeFalsy();
  });
});
