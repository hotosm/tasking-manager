import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import MDEditor from '@uiw/react-md-editor';
import Tribute from 'tributejs';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDropzone } from 'react-dropzone';

import 'tributejs/tribute.css';

import { useOnDrop, useUploadImage } from '../../hooks/UseUploadImage';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import HashtagPaste from './hashtagPaste';
import FileRejections from './fileRejections';
import DropzoneUploadStatus from './uploadStatus';
import { DROPZONE_SETTINGS } from '../../config';
import { htmlFromMarkdown, formatUserNamesToLink } from '../../utils/htmlFromMarkdown';
import { iconConfig } from './editorIconConfig';
import messages from './messages';
import { CurrentUserAvatar } from '../user/avatar';

function CommentInputField({
  comment,
  setComment,
  contributors,
  enableHashtagPaste = false,
  isShowTabNavs = false,
  isShowFooter = false,
  enableContributorsHashtag = false,
  isShowUserPicture = false,
  placeholderMsg = messages.leaveAComment,
  markdownTextareaProps = {},
}: Object) {
  const token = useSelector((state) => state.auth.token);
  const textareaRef = useRef();
  const isBundle = useRef(false);
  const [isShowPreview, setIsShowPreview] = useState(false);

  const appendImgToComment = (url) => setComment(`${comment}\n![image](${url})\n`);
  const [uploadError, uploading, onDrop] = useOnDrop(appendImgToComment);
  const { fileRejections, getRootProps, getInputProps } = useDropzone({
    onDrop,
    ...DROPZONE_SETTINGS,
  });
  const [fileuploadError, fileuploading, uploadImg] = useUploadImage();

  const tribute = new Tribute({
    trigger: '@',
    values: async (query, cb) => {
      try {
        if (!query) return cb(contributors.map((username) => ({ username })));
        const res = await fetchLocalJSONAPI(`users/queries/filter/${query}/`, token);
        cb(res.usernames.map((username) => ({ username })));
      } catch (e) {
        return [];
      }
    },
    lookup: 'username',
    fillAttr: 'username',
    selectTemplate: (item) => `@[${item.original.username}]`,
    itemClass: 'w-100 pv2 ph3 bg-tan hover-bg-blue-grey blue-grey hover-white pointer base-font',
    requireLeadingSpace: true,
    noMatchTemplate: null,
    allowSpaces: true,
    searchOpts: {
      skip: true,
    },
  });

  useEffect(() => {
    // Make sure the type of contributors is not an array until the attachment happens
    if (textareaRef.current.textarea && !isBundle.current && Array.isArray(contributors)) {
      isBundle.current = true;
      tribute.attach(textareaRef.current.textarea);
      textareaRef.current.textarea.addEventListener('tribute-replaced', (e) => {
        setComment(e.target.value);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textareaRef.current, contributors]);

  const handleImagePick = async (event) =>
    await uploadImg(event.target.files[0], appendImgToComment, token);

  return (
    <div {...getRootProps()}>
      {isShowTabNavs && (
        <div className={`flex items-center gap-1 ${isShowUserPicture ? 'mb3' : ''}`}>
          {isShowUserPicture && <CurrentUserAvatar className="w3 h3" />}
          <div className="pv3-ns ph3 ph3-m bg-grey-light dib">
            <span
              role="button"
              className={`pointer db dib-ns pb1 bb bw1 ${
                !isShowPreview ? 'b--blue-dark' : 'b--grey-light'
              }`}
              onClick={() => setIsShowPreview(false)}
            >
              <FormattedMessage {...messages.write} />
            </span>
            <span
              role="button"
              className={`pointer ml3 db dib-ns pb1 bb bw1 ${
                isShowPreview ? 'b--blue-dark' : 'b--grey-light'
              }`}
              onClick={() => setIsShowPreview(true)}
            >
              <FormattedMessage {...messages.preview} />
            </span>
          </div>
        </div>
      )}
      <div className={`${isShowPreview ? 'dn' : ''} bg-white`} data-color-mode="light">
        <MDEditor
          ref={textareaRef}
          preview="edit"
          commands={Object.keys(iconConfig).map((key) => iconConfig[key])}
          extraCommands={[]}
          height={200}
          value={comment}
          onChange={setComment}
          textareaProps={{
            ...getInputProps(),
            spellCheck: 'true',
            placeholder: useIntl().formatMessage(placeholderMsg),
            ...markdownTextareaProps,
          }}
          defaultTabEnable
        />
        <input
          type="file"
          id="image_picker"
          className="dn"
          accept="image/*"
          onChange={handleImagePick}
        />
        {isShowFooter && (
          <div className="dn flex-ns justify-between ba bt-0 w-100 ph2 pv1 relative b--blue-grey textareaDetail">
            <span className="f7 lh-copy gray">
              <FormattedMessage {...messages.attachImage} />
            </span>
            <span className="f7 lh-copy gray">
              <FormattedMessage {...messages.markdownSupported} />
            </span>
          </div>
        )}
      </div>
      {isShowPreview && (
        <div className="db ba ph3" style={{ minHeight: 200, borderColor: '#F0EEEE' }}>
          {comment && (
            <div
              style={{ wordWrap: 'break-word' }}
              className="blue-grey f5 lh-title markdown-content"
              dangerouslySetInnerHTML={htmlFromMarkdown(formatUserNamesToLink(comment))}
            />
          )}
          {!comment && (
            <span className="db mt3">
              <FormattedMessage {...messages.nothingToPreview} />
            </span>
          )}
        </div>
      )}
      {enableHashtagPaste && !isShowPreview && (
        <span className="db blue-grey f6 pt2">
          <HashtagPaste text={comment} setFn={setComment} hashtag="#managers" />
          <span>, </span>
          <HashtagPaste text={comment} setFn={setComment} hashtag="#author" />
          {enableContributorsHashtag && (
            <>
              <span>, </span>
              <HashtagPaste text={comment} setFn={setComment} hashtag="#contributors" />
            </>
          )}
        </span>
      )}
      <DropzoneUploadStatus
        uploading={uploading || fileuploading}
        uploadError={uploadError || fileuploadError}
      />
      <FileRejections files={fileRejections} />
    </div>
  );
}

export default CommentInputField;
