import { types } from '../actions/notifications';

const initialState = {
  notifications: [],
  pagination: { hasNext: false, hasPrev: false, page: 1 },
  unreadCount: null,
};

export const notificationsReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.NOTIFICATIONS_INIT:
      return {
        ...state,
        isLoading: true,
        isFirstLoading: state.isLoading !== false && true,
        isError: false,
      };
    case types.NOTIFICATIONS_SUCCESS:
      const pagedNotifs = action.payload.userMessages.map((n) => ({
        ...n,
        page: action.payload.pagination.page,
      }));
      const goodForMiniResults =
        action.params['status'] &&
        action.params['status'] === 'unread' &&
        action.payload.pagination.page === 1;

      return {
        ...state,
        isLoading: false,
        isError: false,
        isFirstLoading: false,
        notifications: pagedNotifs,
        lastParams: action.params,
        unreadNotificationsMini:
          (goodForMiniResults && pagedNotifs) || state.unreadNotificationsMini,
        pagination: action.payload.pagination,
      };
    case types.NOTIFICATIONS_FAILURE:
      return {
        ...state,
        isLoading: false,
        isFirstLoading: false,
        isError: true,
      };
    case types.SET_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload,
      };
    case types.DECREMENT_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: state.unreadCount - 1,
      };
    default:
      return state;
  }
};
