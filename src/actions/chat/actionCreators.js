import * as constants from '../../constants/chat.constants';
import { mobileEnableScroll } from '../chat';

export const reset = () => ({ type: constants.RESET });
export const clearPreviousMessages = () => ({ type: constants.CLEAR_PREVIOUS_MESSAGES });
export const reOpenChat = () => ({ type: constants.REOPEN_CHAT });

export const hideChat = () => {
    mobileEnableScroll(true);
    return { type: constants.HIDE_CHAT };
};

export const openChat = () => {
    mobileEnableScroll(false);
    return { type: constants.OPEN_CHAT };
};
export const setTransferInitiatorIsChat = () => ({ type: constants.TRANSFER_INITIATOR_IS_CHAT });
export const toggleChat = () => {
    return { type: constants.TOGGLE_CHAT };
};
export const newWebSocketMessage = data => ({
    type: constants.NEW_WEBSOCKET_MESSAGE,
    payload: { data }
});
export const showChatBtn = show => ({
    type: constants.SHOW_CHAT_BUTTON,
    payload: { show }
});

export const setCurrentChat = (chat, userId) => ({
    type: constants.SET_CURRENT_CHAT,
    payload: { chat, userId }
});
export const createUserChatStart = () => ({ type: constants.CREATE_USER_CHAT_START });
export const createUserChatFailure = error => ({
    type: constants.CREATE_USER_CHAT_FAILURE,
    payload: { error }
});
export const createUserChatSuccess = data => ({
    type: constants.CREATE_USER_CHAT_SUCCESS,
    payload: { data }
});

export const resetCurrentChat = () => ({ type: constants.RESET_CURRENT_CHAT });

export const addNewChat = chat => ({ type: constants.ADD_NEW_CHAT, payload: { chat } });

export const addSupportChat = supportChat => ({
    type: constants.ADD_SUPPORT_CHAT,
    payload: { supportChat }
});
export const addCommonChat = commonChat => ({
    type: constants.ADD_COMMON_CHAT,
    payload: { commonChat }
});

export const getChatStart = () => ({ type: constants.GET_CHAT_START });
export const getChatFailure = error => ({ type: constants.GET_CHAT_FAILURE, payload: { error } });
export const getChatSuccess = chat => ({ type: constants.GET_CHAT_SUCCESS, payload: { chat } });
export const getChatsStart = () => ({ type: constants.GET_CHATS_START });
export const getChatsFailure = error => ({ type: constants.GET_CHATS_FAILURE, payload: { error } });
export const getChatsSuccess = chats => ({ type: constants.GET_CHATS_SUCCESS, payload: { chats } });
export const fillSupportChats = supportChats => ({
    type: constants.FILL_SUPPORT_CHATS, payload: { supportChats }
});
export const fillCommonChats = commonChats => ({
    type: constants.FILL_COMMON_CHATS, payload: { commonChats }
});
export const fillChatList = ({ chats, supportChats, commonChats }) => ({
    type: constants.FILL_CHATS_LIST,
    payload: { chats, supportChats, commonChats }
});
export const sendMoneyRequestStart = () => ({ type: constants.SEND_MONEY_REQUEST_START });
export const sendMoneyRequestFailure = error => ({
    type: constants.SEND_MONEY_REQUEST_FAILURE,
    payload: { error }
});
export const sendMoneyRequestSuccess = () => ({ type: constants.SEND_MONEY_REQUEST_SUCCESS });

export const getBotsStart = () => ({ type: constants.GET_BOTS_START });
export const getBotsFailure = error => ({ type: constants.GET_BOTS_FAILURE, payload: { error } });
export const getBotsSuccess = bots => ({ type: constants.GET_BOTS_SUCCESS, payload: { bots } });
export const getChatMessagesStart = () => ({ type: constants.GET_CHAT_MESSAGES_START });
export const getChatMessagesFailure = error => ({
    type: constants.GET_CHAT_MESSAGES_FAILURE,
    payload: { error }
});
export const getChatMessagesSuccess = data => ({
    type: constants.GET_CHAT_MESSAGES_SUCCESS,
    payload: { data }
});
export const addPreviousMessagesStart = () => ({ type: constants.ADD_PREVIOUS_MESSAGES_START });
export const addPreviousMessagesFailure = error => ({
    type: constants.ADD_PREVIOUS_MESSAGES_FAILURE,
    payload: { error }
});
export const addPreviousMessagesSuccess = previousMessages => ({
    type: constants.ADD_PREVIOUS_MESSAGES_SUCCESS,
    payload: { previousMessages }
});

export const markRead = chatId => ({
    type: constants.MARK_CHAT_AS_READ,
    payload: { chatId }
});

export const sendMessageStart = () => ({ type: constants.SEND_MESSAGE_START });
export const sendMessageFailure = error => ({
    type: constants.SEND_MESSAGE_FAILURE,
    payload: { error }
});
export const sendMessageSuccess = data => ({
    type: constants.SEND_MESSAGE_SUCCESS,
    payload: { data }
});

