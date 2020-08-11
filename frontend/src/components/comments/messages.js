import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on comment input field.
 */
export default defineMessages({
  imageUploadFailed: {
    id: 'comment.input.imageUpload.error',
    defaultMessage: 'The image upload failed.',
  },
  imageUploadOnProgress: {
    id: 'comment.input.imageUpload.progress',
    defaultMessage: 'Uploading file...',
  },
  managersHashtagTip: {
    id: 'comment.hashtags.help.managers',
    defaultMessage: 'Add "{hashtag}" to notify the project managers about your comment.',
  },
  authorHashtagTip: {
    id: 'comment.hashtags.help.author',
    defaultMessage: 'Add "{hashtag}" to notify the project author about your comment.',
  },
});
