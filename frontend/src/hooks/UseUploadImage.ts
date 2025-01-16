import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { pushToLocalJSONAPI } from '../network/genericJSONRequest';
import { slugifyFileName } from '../utils/slugifyFileName';
import { RootStore } from '../store';

export const useUploadImage = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const uploadImg = useCallback((file: File, updateFn: any, token: string) => {
    if (file && updateFn && token) {
      const promise = new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
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
  const token = useSelector((state: RootStore) => state.auth.token);
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