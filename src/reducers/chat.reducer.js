import moment from 'moment';
import * as constants from '../constants/chat.constants';
import { LOGIN_INIT_SUCCESS } from '../constants/abolAuth.constants';
import {
    escapeMessage, escapeMessages, getMessagesWithParsedTime,
    getMessageWithParsedTime, getChatsWithParsedTime, getChatWithParsedTime,
} from '../actions/chat';
import EmojiParser from '../../tools/lib/emojiParser';


const INITIAL_STATE = {
    opened: false,
    showChatButton: false,
    messages: {},
    chats: [],
    supportChats: [],
    commonChats: [],
    prevMsgLoading: false,
    messagesLoading: false,
    chatsLoading: false,
    chatIsLoading: false,
    botsLoading: false,
    sendMessageLoading: false,
    transferModalIsOpen: false
};

const emojiParser = new EmojiParser('/emoji');

export default function (state = INITIAL_STATE, action) {
    switch (action.type) {
        case constants.ADD_PREVIOUS_MESSAGES_START:
            return {
                ...state,
                prevMsgLoading: true,
                error: ''
            };
        case constants.ADD_PREVIOUS_MESSAGES_FAILURE:
            return {
                ...state,
                prevMsgLoading: false,
                error: action.payload.error
            };
        case constants.ADD_PREVIOUS_MESSAGES_SUCCESS: {
            const prevState = {
                ...state,
                prevMsgLoading: false,
            };

            let { previousMessages } = action.payload;
            if (!previousMessages || previousMessages.length < 2) return prevState;

            const firstMsgId = previousMessages[previousMessages.length - 1].Id;
            const messages = [...state.messages[state.currentChat.Id]];

            const firstMsg = messages.find(msg => (msg.Id === firstMsgId));

            if (firstMsg) return prevState;

            previousMessages.shift();

            previousMessages = previousMessages.reverse();

            previousMessages = getMessagesWithParsedTime(previousMessages);
            previousMessages = escapeMessages(previousMessages, emojiParser);

            const lastMessageCreateTime = previousMessages[previousMessages.length - 1].DateCreated;
            if (!messages.length) return prevState;

            const i = messages.findIndex(msg => (msg.DateCreated.isAfter(lastMessageCreateTime)));
            messages.splice(i, 0, ...previousMessages);

            return {
                ...state,
                messages: { ...state.messages, [state.currentChat.Id]: messages },
                prevMsgLoading: false
            };
        }
        case constants.GET_CHAT_MESSAGES_START:
            return {
                ...state,
                messagesLoading: true,
                error: ''
            };
        case constants.GET_CHAT_MESSAGES_FAILURE:
            return {
                ...state,
                messagesLoading: false,
                error: action.payload.error
            };
        case constants.GET_CHAT_MESSAGES_SUCCESS: {
            const { data: { chatId, messages } = {} } = action.payload;
            const messagesReversed = messages.reverse();
            const messagesWithTime = getMessagesWithParsedTime(messagesReversed);
            const messagesEscaped = escapeMessages(messagesWithTime, emojiParser);

            return {
                ...state,
                messagesLoading: false,
                messages: { ...state.messages, [chatId]: messagesEscaped }
            };
        }
        case constants.GET_BOTS_START:
            return {
                ...state,
                botsLoading: true,
                error: ''
            };
        case constants.GET_BOTS_FAILURE:
            return {
                ...state,
                botsLoading: false,
                error: action.payload.error
            };
        case constants.GET_BOTS_SUCCESS:
            return {
                ...state,
                botsLoading: false,
                bots: action.payload.bots
            };

        case constants.CLEAR_PREVIOUS_MESSAGES: {
            if (!state.currentChat) return state;
            const messages = [...state.messages[state.currentChat.Id]];
            const n = 30;
            if (messages.length < 2 * n) return state;
            messages.splice(0, messages.length - n);
            return {
                ...state,
                messages: { ...state.messages, [state.currentChat.Id]: messages }
            };
        }

        case constants.SEND_MESSAGE_START: {
            return {
                ...state,
                sendMessageLoading: true,
                error: ''
            };
        }
        case constants.SEND_MESSAGE_FAILURE: {
            return {
                ...state,
                sendMessageLoading: false,
                error: action.payload.error
            };
        }
        case constants.SEND_MESSAGE_SUCCESS: {
            return {
                ...state,
                sendMessageLoading: false,
            };
        }

        case constants.SEND_MONEY_REQUEST_START: {
            return {
                ...state,
                sendMoneyRequestLoading: true,
                error: ''
            };
        }
        case constants.SEND_MONEY_REQUEST_FAILURE: {
            return {
                ...state,
                sendMoneyRequestLoading: false,
                error: action.payload.error
            };
        }
        case constants.SEND_MONEY_REQUEST_SUCCESS: {
            return {
                ...state,
                sendMoneyRequestLoading: false,
            };
        }

        case constants.NEW_WEBSOCKET_MESSAGE: {
            const { data: { chatId, message } = {} } = action.payload;
            if (!chatId || !message) return state;
            if (!state.messages[chatId]) return state;
            const messageWithTime = getMessageWithParsedTime(message);
            const messageEscaped = escapeMessage(messageWithTime, emojiParser);

            const messages = [...state.messages[chatId]];
            const duplicateIndex = messages.findIndex(msg => (msg.Id === message.Id));
            if (duplicateIndex < 0) {
                messages.push(messageEscaped);
            } else {
                messages.splice(duplicateIndex, 1, messageEscaped);
            }

            return {
                ...state,
                messages: { ...state.messages, [chatId]: messages }
            };
        }


        case constants.OPEN_CHAT:
            return {
                ...state,
                opened: true,
                reOpen: false
            };

        case constants.SET_TRANSFER_MODAL_OPEN:
            return {
                ...state,
                transferModalIsOpen: action.payload.open
            };

        case constants.TOGGLE_CHAT:
            return {
                ...state,
                opened: !state.opened,
                currentChat: state.opened ? undefined : state.currentChat
            };

        case constants.HIDE_CHAT:
            return {
                ...state,
                opened: false,
                currentChat: undefined,
                currentChatName: ''
            };

        case constants.FILL_CHATS_LIST: {
            let { chats } = action.payload;
            const { supportChats, commonChats } = action.payload;
            chats = getChatsWithParsedTime(chats);
            return {
                ...state,
                chats,
                supportChats,
                commonChats
            };
        }

        case constants.ADD_NEW_CHAT: {
            let { chat: newChat } = action.payload;
            if (!newChat) return state;

            // парсим поле даты последнего непрочитанного сообщения
            if (newChat.LastUnreadMessageTime) {
                newChat = getChatWithParsedTime(newChat);
            }

            const i = state.chats.findIndex(chat => chat.Id === newChat.Id);
            const chats = [...state.chats];

            if (i < 0) {
                chats.unshift(newChat);
            } else {
                chats.splice(i, 1, newChat);
            }

            return {
                ...state,
                chats
            };
        }
        case constants.ADD_SUPPORT_CHAT: {
            const { supportChat } = action.payload;

            const i = state.supportChats.findIndex(chat => chat.Id === supportChat.Id);
            const supportChats = [...state.supportChats];

            if (i < 0) {
                supportChats.unshift(supportChat);
            } else {
                supportChats.splice(i, 1, supportChat);
            }

            return {
                ...state,
                supportChats
            };
        }
        case constants.ADD_COMMON_CHAT: {
            const { commonChat } = action.payload;

            const i = state.commonChats.findIndex(chat => chat.Id === commonChat.Id);
            const commonChats = [...state.commonChats];

            if (i < 0) {
                commonChats.unshift(commonChat);
            } else {
                commonChats.splice(i, 1, commonChat);
            }

            return {
                ...state,
                commonChats
            };
        }


        case constants.SET_CURRENT_CHAT: {
            let { chat } = action.payload;
            const { userId } = action.payload;
            if (!chat || !userId) return state;

            if (chat.LastUnreadMessageTime && !moment.isMoment(chat.LastUnreadMessageTime)) {
                chat = getChatWithParsedTime(chat);
            }

            let chatName = chat.Name;
            if (!chatName && chat.Users.length === 2) {
                const companion = chat.Users.find(u => u.BankokId !== +userId);
                if (companion) {
                    chatName = companion.DisplayName;
                }
            }

            return {
                ...state,
                currentChat: chat,
                currentChatName: chatName
            };
        }

        case constants.SHOW_CHAT_BUTTON:
            return {
                ...state,
                showChatButton: action.payload.show,
            };

        case constants.REOPEN_CHAT:
            return {
                ...state,
                reOpen: true,
            };

        case constants.RESET_CURRENT_CHAT:
            return {
                ...state,
                currentChat: undefined,
            };

        case constants.RESET: {
            return INITIAL_STATE;
        }

        case LOGIN_INIT_SUCCESS: {
            return INITIAL_STATE;
        }

        case constants.MARK_CHAT_AS_READ: {
            let newState;
            const { chatId } = action.payload;
            let { chats = [], commonChats = [], supportChats = [] } = state;
            if (!chatId) {
                newState = state;
            } else {
                const i = chats.findIndex(chat => (chat.Id === chatId));
                if (i < 0) {
                    newState = state;
                } else {
                    const j = commonChats.findIndex(chat => (chat.Id === chatId));
                    const k = supportChats.findIndex(chat => (chat.Id === chatId));

                    const chat = {
                        ...chats[i],
                        LastUnreadMessageTime: null,
                        UnreadMessagesCount: 0
                    };

                    chats = [...state.chats];
                    chats.splice(i, 1, chat);

                    if (j >= 0) {
                        commonChats = [...commonChats];
                        commonChats.splice(j, 1, chat);
                    }

                    if (k >= 0) {
                        supportChats = [...supportChats];
                        supportChats.splice(k, 1, chat);
                    }

                    newState = {
                        ...state,
                        chats,
                        commonChats,
                        supportChats
                    };
                }
            }

            return newState;
        }

        case constants.GET_CHATS_START: {
            return {
                ...state,
                chatsLoading: true,
                error: '',
            };
        }
        case constants.GET_CHATS_FAILURE: {
            return {
                ...state,
                chatsLoading: false,
                error: action.payload.error,
            };
        }
        case constants.GET_CHATS_SUCCESS: {
            return {
                ...state,
                chatsLoading: false,
            };
        }

        case constants.GET_CHAT_START: {
            return {
                ...state,
                chatIsLoading: true,
                error: '',
            };
        }
        case constants.GET_CHAT_FAILURE: {
            return {
                ...state,
                chatIsLoading: false,
                error: action.payload.error,
            };
        }
        case constants.GET_CHAT_SUCCESS: {
            return {
                ...state,
                chatIsLoading: false,
            };
        }

        default:
            return state;
    }
}
