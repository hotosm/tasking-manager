import { useState, useCallback } from 'react';
import { useTypedSelector } from '@Store/hooks';

import { pushToLocalJSONAPI } from '../network/genericJSONRequest';
import { slugifyFileName } from '../utils/slugifyFileName';

export const useUploadImage = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const uploadImg = useCallback((file: File, updateFn: any, token: string) => {
    if (file && updateFn && token) {
      const promise = new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          //eslint-disable-next-line no-extra-boolean-cast
          if (!!reader.result) {
            resolve(reader.result);
          } else {
            reject(Error('Failed converting to base64'));
          }
        };
      });
      promise.then(
        (result) => {
          const payload = JSON.stringify({
            mime: file.type,
            // @ts-expect-error TS Migrations
            data: result.split('base64,')[1],
            filename: slugifyFileName(file.name, file.type),
          });
          setUploading(true);
          pushToLocalJSONAPI('system/image-upload/', payload, token)
            .then((res) => {
              updateFn(res.url);
              setUploading(false);
              setUploadError(null);
            })
            .catch((e) => {
              setUploadError(e);
              setUploading(false);
            });
        },
        (err) => {
          setUploadError(err);
        },
      );
    }
  }, []);
  return [uploadError, uploading, uploadImg];
};

export const useOnDrop = (appendImgToComment: string) => {
  const token = useTypedSelector((state) => state.auth.token);
  const [uploadError, uploading, uploadImg] = useUploadImage();

  const onDrop = useCallback(
    // @ts-expect-error TS Migrations
    (acceptedFiles) => {
      // @ts-expect-error TS Migrations
      acceptedFiles.forEach(async (file) => await uploadImg(file, appendImgToComment, token));
    },
    [token, uploadImg, appendImgToComment],
  );
  return [uploadError, uploading, onDrop];
};
