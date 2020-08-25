import React from 'react';
import { useSelector } from 'react-redux';
import ReactTextareaAutocomplete from '@webscopeio/react-textarea-autocomplete';
import { useDropzone } from 'react-dropzone';

import { useOnDrop } from '../../hooks/UseUploadImage';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import HashtagPaste from './hashtagPaste';
import FileRejections from './fileRejections';
import DropzoneUploadStatus from './uploadStatus';
import { DROPZONE_SETTINGS } from '../../config';

export const CommentInputField = ({ comment, setComment, enableHashtagPaste = false }: Object) => {
  const token = useSelector((state) => state.auth.get('token'));
  const appendImgToComment = (url) => setComment(`${comment}\n![image](${url})\n`);
  const [uploadError, uploading, onDrop] = useOnDrop(appendImgToComment);
  const { fileRejections, getRootProps, getInputProps } = useDropzone({
    onDrop,
    ...DROPZONE_SETTINGS,
  });

  return (
    <div {...getRootProps()}>
      <UserFetchTextarea
        {...getInputProps()}
        value={comment}
        setValueFn={(e) => setComment(e.target.value)}
        token={token}
      />
      {comment && enableHashtagPaste && (
        <span className="blue-grey f6 pt2">
          <HashtagPaste text={comment} setFn={setComment} hashtag="#managers" />
          <span>, </span>
          <HashtagPaste text={comment} setFn={setComment} hashtag="#author" />
        </span>
      )}
      <DropzoneUploadStatus uploading={uploading} uploadError={uploadError} />
      <FileRejections files={fileRejections} />
    </div>
  );
};

export const UserFetchTextarea = ({ value, setValueFn, token }) => {
  const fetchUsers = async (user) => {
    const url = `users/queries/filter/${user}/`;
    let userItems;

    try {
      const res = await fetchLocalJSONAPI(url, token);
      userItems = res.usernames.map((u) => {
        return { name: u };
      });
    } catch (e) {
      userItems = [];
    }

    return userItems;
  };

  return (
    <ReactTextareaAutocomplete
      value={value}
      listClassName="list ma0 pa0 ba b--grey-light bg-blue-grey overflow-y-scroll base-font f5 relative z-5"
      listStyle={{ maxHeight: '16rem' }}
      onChange={setValueFn}
      className="w-100 f5 pa2"
      style={{ fontSize: '1rem' }}
      loadingComponent={() => <span></span>}
      rows={3}
      trigger={{
        '@': {
          dataProvider: fetchUsers,
          component: Item,
          output: (item, trigger) => '@[' + item.name + ']',
        },
      }}
    />
  );
};

const Item = ({ entity: { name } }) => (
  <div className="w-100 pv2 ph3 tc bg-tan hover-bg-blue-grey blue-grey hover-white pointer">
    {`${name}`}
  </div>
);
