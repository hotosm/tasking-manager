import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { useMutation } from '@tanstack/react-query';
import ReactPlaceholder from 'react-placeholder';

import messages from './messages';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import { PaginatorLine } from '../paginator';
import { Button } from '../button';
import { Alert } from '../alert';
import { CommentInputField } from '../comments/commentInput';
import { MessageStatus } from '../comments/status';
import { UserAvatar } from '../user/avatar';
import { htmlFromMarkdown, formatUserNamesToLink } from '../../utils/htmlFromMarkdown';
import { useEditProjectAllowed } from '../../hooks/UsePermissions';
import { DeleteModal } from '../deleteModal';
import { postProjectComment, useCommentsQuery } from '../../api/questionsAndComments';

import './styles.scss';

export const PostProjectComment = ({ projectId, refetchComments, contributors }) => {
  const token = useSelector((state) => state.auth.token);
  const locale = useSelector((state) => state.preferences['locale']);
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () => postProjectComment(projectId, comment, token, locale),
    onSuccess: () => {
      refetchComments();
      setComment('');
    },
  });

  const saveComment = () => {
    mutation.mutate({ message: comment });
  };

  return (
    <div className="w-100 cf mh4 pv4 bg-white center shadow-7 ba0 br1 post-comment-ctr">
      <div className={`w-100 h-100`} style={{ position: 'relative', display: 'block' }}>
        <CommentInputField
          comment={comment}
          setComment={setComment}
          enableHashtagPaste
          isShowUserPicture
          isShowFooter
          isShowTabNavs
          contributors={
            Array.isArray(contributors) ? contributors.map((user) => user.username) : undefined
          }
        />
      </div>

      <div className="fl w-100 tr pt1 pr0-ns pr1 ml-auto">
        <Button
          onClick={() => saveComment()}
          className="bg-red white f5"
          disabled={comment === ''}
          loading={mutation.isLoading}
        >
          <FormattedMessage {...messages.post} />
        </Button>
      </div>
      <div className="cf w-100 fr tr pr2 mt3">
        <MessageStatus status={mutation.status} comment={comment} />
      </div>
    </div>
  );
};

export const QuestionsAndComments = ({ project, contributors, titleClass }) => {
  const token = useSelector((state) => state.auth.token);
  const [page, setPage] = useState(1);
  const [userCanEditProject] = useEditProjectAllowed(project);
  const projectId = project.projectId;

  const handlePagination = (val) => {
    setPage(val);
  };

  const { data: comments, status: commentsStatus, refetch } = useCommentsQuery(projectId, page);

  return (
    <div className="bg-tan-dim">
      <h3 className={titleClass}>
        <FormattedMessage {...messages.questionsAndComments} />
      </h3>
      <div className="ph6-l ph4 pb5 w-100 w-70-l">
        {commentsStatus === 'loading' && <ReactPlaceholder type="media" rows={3} ready={false} />}{' '}
        {commentsStatus === 'error' && (
          <div className="mb4">
            <Alert type="error">
              <FormattedMessage {...messages.errorLoadingComments} />
            </Alert>
          </div>
        )}
        {commentsStatus === 'success' && (
          <>
            {comments?.chat.length ? (
              <CommentList
                userCanEditProject={userCanEditProject}
                projectId={projectId}
                comments={comments.chat}
                retryFn={refetch}
              />
            ) : (
              <div className="pv4 blue-grey tc">
                <FormattedMessage {...messages.noComments} />
              </div>
            )}
          </>
        )}
        {comments?.pagination?.pages > 0 && (
          <PaginatorLine
            activePage={page}
            setPageFn={handlePagination}
            lastPage={comments.pagination.pages}
            className="tr w-100 center pv3 flex justify-end"
          />
        )}
        {token ? (
          <PostProjectComment
            projectId={projectId}
            refetchComments={refetch}
            contributors={contributors}
          />
        ) : (
          <div className="w-90 center pa3">
            <Alert type="info">
              <FormattedMessage {...messages.loginTocomment} />
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
};

export function CommentList({ userCanEditProject, projectId, comments, retryFn }: Object) {
  const username = useSelector((state) => state.auth.userDetails.username);

  return (
    <div className="pt3">
      {comments.map((comment) => (
        <div
          className="w-100 center cf mb2 ba0 br1 b--grey-light bg-white shadow-7 comment-item"
          key={comment.id}
        >
          <div className="flex justify-between">
            <div className="flex items-center">
              <div className="">
                <UserAvatar
                  username={comment.username}
                  picture={comment.pictureUrl}
                  colorClasses="white bg-blue-grey"
                  size="medium"
                />
              </div>
              <div className="ml2">
                <a
                  href={`/users/${comment.username}`}
                  className="blue-dark fw5 link underline-hover"
                >
                  {comment.username}
                </a>
                <p className="blue-grey f6 ma0">
                  <RelativeTimeWithUnit date={comment.timestamp} />
                </p>
              </div>
            </div>
            <div>
              {(userCanEditProject || comment.username === username) && (
                <DeleteModal
                  id={comment.id}
                  type={'comments'}
                  className="bg-transparent bw0 w2 h2 lh-copy overflow-hidden blue-light p0 mb1 hover-red"
                  onDelete={retryFn}
                  endpointURL={`projects/${projectId}/comments/${comment.id}/`}
                />
              )}
            </div>
          </div>
          <div
            style={{ wordWrap: 'break-word' }}
            className="blue-dark f5 lh-title markdown-content text-dim"
            dangerouslySetInnerHTML={htmlFromMarkdown(formatUserNamesToLink(comment.message))}
          />
        </div>
      ))}
    </div>
  );
}
