import { renderHook } from '@testing-library/react';

import { useUploadImage } from '../UseUploadImage';

describe('useUploadImage', () => {
  it('updateFn returns error, loading and uploadImg function', () => {
    // this test is incomplete because it's difficult to test the FileReader
    const { result } = renderHook(() => useUploadImage());
    const [error, uploading, uploadImg] = result.current;
    expect(error).toBeFalsy();
    expect(uploading).toBeFalsy();
    expect(typeof uploadImg).toBe('function');
  });
});
