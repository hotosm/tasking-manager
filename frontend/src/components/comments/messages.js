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
  sendingMessage: {
    id: 'comment.input.sending.progress',
    defaultMessage: 'Sending message...',
  },
  messageSent: {
    id: 'comment.input.sending.success',
    defaultMessage: 'Message sent.',
  },
  messageError: {
    id: 'comment.input.sending.error',
    defaultMessage: 'An error occurred while sending message.',
  },
  managersHashtagTip: {
    id: 'comment.hashtags.help.managers',
    defaultMessage: 'Add "{hashtag}" to notify the project managers about your comment.',
  },
  authorHashtagTip: {
    id: 'comment.hashtags.help.author',
    defaultMessage: 'Add "{hashtag}" to notify the project author about your comment.',
  },
  contributorsHashtagTip: {
    id: 'comment.hashtags.help.contributors',
    defaultMessage: 'Add "{hashtag}" to notify the task contributors about your comment.',
  },
  nothingToPreview: {
    id: 'comment.preview.nothingToPreview',
    defaultMessage: 'Nothing to preview',
  },
  leaveAComment: {
    id: 'comment.preview.leaveAComment',
    defaultMessage: 'Leave a comment...',
  },
  write: {
    id: 'textarea.write',
    defaultMessage: 'Write',
  },
  preview: {
    id: 'textarea.preview',
    defaultMessage: 'Preview',
  },
  attachImage: {
    id: 'comment.write.attachImage',
    defaultMessage: 'Attach image by dragging and dropping',
  },
  markdownSupported: {
    id: 'comment.write.markdownSupported',
    defaultMessage: 'Markdown supported',
  },
});
