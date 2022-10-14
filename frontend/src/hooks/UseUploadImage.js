import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { pushToLocalJSONAPI } from '../network/genericJSONRequest';
import { slugifyFileName } from '../utils/slugifyFileName';

export const useUploadImage = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const uploadImg = useCallback((file, updateFn, token) => {
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

export const useOnDrop = (appendImgToComment) => {
  const token = useSelector((state) => state.auth.token);
  const [uploadError, uploading, uploadImg] = useUploadImage();

  const onDrop = useCallback(
    (acceptedFiles) => {
      acceptedFiles.forEach(async (file) => await uploadImg(file, appendImgToComment, token));
    },
    [token, uploadImg, appendImgToComment],
  );
  return [uploadError, uploading, onDrop];
};
