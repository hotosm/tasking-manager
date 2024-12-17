import { types } from '../actions/notifications';

type Notification = {
  notifications: any[];
  userMessages: any[];
  isLoading: boolean;
  isFirstLoading: boolean;
  isError: boolean;
  unreadNotificationsMini: any[];
  pagination: { hasNext: boolean; hasPrev: boolean; page: number };
  unreadCount: number;
  params: {
    status: string;
  }
};

const initialState = {
  notifications: [],
  userMessages: [],
  unreadNotificationsMini: [],
  isLoading: false,
  isFirstLoading: false,
  isError: false,
  pagination: { hasNext: false, hasPrev: false, page: 1 },
  unreadCount: 0,
  params: {
    status: ""
  }
} satisfies Notification;

type Actions = {
  type: typeof types.NOTIFICATIONS_INIT;
} | {
  type: typeof types.NOTIFICATIONS_SUCCESS;
  userMessages: any[];
  pagination: { page: number };
  params: any;
} | {
  type: typeof types.NOTIFICATIONS_FAILURE;
} | {
  type: typeof types.SET_UNREAD_COUNT;
  payload: number;
} | {
  type: typeof types.DECREMENT_UNREAD_COUNT;
};

export const notificationsReducer = (state = initialState, action: Actions) => {
  switch (action.type) {
    case types.NOTIFICATIONS_INIT:
      return {
        ...state,
        isLoading: true,
        isFirstLoading: state.isLoading !== false && true,
        isError: false,
      };
    case types.NOTIFICATIONS_SUCCESS:
      const pagedNotifs = action.userMessages.map((n) => ({
        ...n,
        page: action.pagination.page,
      }));
      const goodForMiniResults =
        action.params['status'] &&
        action.params['status'] === 'unread' &&
        action.pagination.page === 1;

      return {
        ...state,
        isLoading: false,
        isError: false,
        isFirstLoading: false,
        notifications: pagedNotifs,
        lastParams: action.params,
        unreadNotificationsMini:
          (goodForMiniResults && pagedNotifs) || state.unreadNotificationsMini,
        pagination: action.pagination,
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
