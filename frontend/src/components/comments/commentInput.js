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

export const CommentInputField = ({
  comment,
  setComment,
  contributors,
  enableHashtagPaste = false,
  autoFocus,
}: Object) => {
  const appendImgToComment = (url) => setComment(`${comment}\n![image](${url})\n`);
  const [uploadError, uploading, onDrop] = useOnDrop(appendImgToComment);
  const { fileRejections, getRootProps, getInputProps } = useDropzone({
    onDrop,
    ...DROPZONE_SETTINGS,
  });

  return (
    <div {...getRootProps()}>
      <UserFetchTextarea
        inputProps={getInputProps}
        value={comment}
        contributors={contributors}
        setValueFn={(e) => setComment(e.target.value)}
        autoFocus={autoFocus}
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

export const UserFetchTextarea = ({ value, setValueFn, inputProps, contributors, autoFocus }) => {
  const token = useSelector((state) => state.auth.get('token'));
  const fetchUsers = async (user) => {
    try {
      if (!user) return contributors.map((u) => ({ name: u }));
      const res = await fetchLocalJSONAPI(`users/queries/filter/${user}/`, token);
      return res.usernames.map((u) => ({ name: u }));
    } catch (e) {
      return [];
    }
  };

  return (
    <ReactTextareaAutocomplete
      {...inputProps}
      value={value}
      innerRef={(textArea) => autoFocus && textArea && textArea.focus()}
      listClassName="list ma0 pa0 ba b--grey-light bg-blue-grey overflow-y-scroll base-font f5 relative z-5"
      listStyle={{ maxHeight: '16rem' }}
      onChange={setValueFn}
      minChar={0}
      className="w-100 f5 pa2"
      style={{ fontSize: '1rem' }}
      loadingComponent={() => <span></span>}
      rows={3}
      trigger={{
        '@': {
          dataProvider: fetchUsers,
          component: Item,
          output: (item, trigger) => `@[${item.name}]`,
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
