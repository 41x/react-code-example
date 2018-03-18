import uuid from 'uuid/v4';
import { get } from 'lodash';
import axios, { getCommonHeaders } from '../../core/axios';
import {
    toggleChat, sendMoneyRequestFailure, sendMoneyRequestSuccess, sendMessageSuccess,
    sendMoneyRequestStart, sendMessageStart, getBotsFailure, getBotsSuccess,
    getBotsStart, getChatsSuccess, getChatFailure, getChatSuccess, getChatStart, addNewChat,
    sendMessageFailure, createUserChatSuccess, createUserChatStart, createUserChatFailure,
    addCommonChat, addSupportChat, addPreviousMessagesFailure, addPreviousMessagesStart,
    addPreviousMessagesSuccess, fillChatList, getChatMessagesFailure,
    getChatMessagesStart, getChatMessagesSuccess, getChatsFailure, getChatsStart,
    markRead, setCurrentChat, mobileEnableScroll
} from '../chat';


const ERROR = {
    PREVIOUS_MESSAGES: 'Произошла ошибка: Не удалось получить предыдущие сообщения.',
    GET_MESSAGES: 'Произошла ошибка: Не удалось получить сообщения.',
    CREATE_USER_CHAT: 'Произошла ошибка: Не удалось создать чат пользователя.',
    SEND_MESSAGE: 'Произошла ошибка: Не удалось отправить сообщение.',
    GET_CHAT: 'Произошла ошибка: Не удалось получить чат пользователя.',
    GET_CHATS: 'Произошла ошибка: Не удалось получить чаты пользователя.',
    GET_BOTS: 'Произошла ошибка: Не удалось получить данные оператора.',
    MONEY_REQUEST: 'Произошла ошибка: Не удалось создать запрос на перевод.'
};

export const toggleChatAndScroll = () => {
    return (dispatch, getState) => {
        const opened = get(getState(), 'chat.opened');
        mobileEnableScroll(opened);
        dispatch(toggleChat());
    };
};

export const addChat = (chat) => {
    return (dispatch) => {
        dispatch(addNewChat(chat));
        const { Users = [] } = chat;
        if (Users.length === 2) {
            const bot = Users.find(u => (u.BankokId === 0));
            if (bot) {
                dispatch(addSupportChat(chat));
                return;
            }
        }

        dispatch(addCommonChat(chat));
    };
};

// region Получить сообщения
/**
 * Get messages by chat id.
 * @param {string} chatId.
 */
export function getChatMessages (chatId) {
    return (dispatch, getState) => {
        dispatch(getChatMessagesStart());
        return getMessagesRequest(chatId, '', 20, 0, getState().auth.sessionToken)
            .then(({ data: { Result } = {} }) => {
                if (Result) {
                    dispatch(getChatMessagesSuccess({ chatId, messages: Result }));
                } else {
                    dispatch(getChatMessagesFailure(ERROR.GET_MESSAGES));
                }
            }, ({ data: { Error } = {} }) => {
                dispatch(getChatMessagesFailure(Error || ERROR.GET_MESSAGES));
            });
    };
}

// endregion

// region Получить чат
/**
 * Get chat by id.
 */
export const getChat = (chatId) => {
    return (dispatch, getState) => {
        const { auth: { sessionToken: token } = {} } = getState();
        dispatch(getChatStart());
        return axios.get(`chat/chats/${chatId}`, { headers: { SessionToken: token } })
            .then(
                ({ data: { Result, Success } = {} }) => {
                    if (Success && Result) {
                        dispatch(getChatSuccess(Result));
                        dispatch(addChat(Result));
                    } else {
                        dispatch(getChatFailure(ERROR.GET_CHAT));
                    }
                },
                ({ data: { Error } = {} }) => {
                    dispatch(getChatFailure(Error || ERROR.GET_CHAT));
                }
            );
    };
};

// endregion

export function setActiveChat (chat) {
    return (dispatch, getState) => {
        const { user: { Uid: uid } = {}, chat: { messages } = {} } = getState();

        dispatch(setCurrentChat(chat, uid));
        if (!chat.isDummy && !messages[chat.Id]) {
            dispatch(getChatMessages(chat.Id));
        }
    };
}

// region Получить чаты
/**
 * Get chats.
 */
export const getChats = () => {
    return (dispatch, getState) => {
        const { auth: { sessionToken: token } = {} } = getState();
        dispatch(getChatsStart());
        return axios.get(`chat/chats?nc=${new Date().getTime()}`, {
            headers: {
                SessionToken: token
            }
        })
            .then(
                ({ data: { Result: chats, Success } = {} }) => {
                    if (Success && chats) {
                        const supportChats = [];
                        const commonChats = [];
                        let nextCurrentChat;
                        const {
                            chat: {
                                currentChat: { Id: currentChatId, isDummy } = {},
                                bots = []
                            }
                        } = getState();
                        // const botsWithoutChats = [];

                        chats.forEach((chat) => {
                            const { Users, Id, IsGroup: isGroup } = chat;

                            // находим текущий чат
                            if (Id === currentChatId) {
                                nextCurrentChat = chat;
                            } else if (isDummy && !isGroup && Users.length === 2) {
                                const user = Users.find(u => u.Id === currentChatId);
                                if (user) {
                                    nextCurrentChat = chat;
                                }
                            }

                            // группируем чаты
                            if (Users.length === 2) {
                                const bot = Users.find(({ BankokId }) => (BankokId === 0));
                                const arr = bot ? supportChats : commonChats;
                                arr.push(chat);
                            } else {
                                commonChats.push(chat);
                            }
                        });

                        // ищем ботов без чата
                        const botsWithoutChats = bots.filter((bot) => {
                            const chat = supportChats.find(({ Users = [], IsGroup }) => {
                                if (IsGroup) return false;
                                return !!Users.find(u => u.Id === bot.UserId);
                            });
                            return !chat;
                        });

                        // создаем заглушки для таких ботов
                        botsWithoutChats.forEach((bot) => {
                            supportChats.push({
                                isDummy: true,
                                Id: bot.UserId,
                                Users: [bot],
                                isBot: true
                            });
                        });

                        if (nextCurrentChat) {
                            dispatch(setActiveChat(nextCurrentChat));
                        }

                        dispatch(fillChatList({ chats, supportChats, commonChats }));
                        dispatch(getChatsSuccess(chats));
                    } else {
                        dispatch(getChatsFailure(ERROR.GET_CHATS));
                    }
                },
                ({ data: { Error } = {} }) => {
                    dispatch(getChatsFailure(Error || ERROR.GET_CHATS));
                }
            );
    };
};
// endregion

// region Запросить перевод
/**
 * Запрос на перевод в чате.
 */
export const sendMoneyRequest = (amount, requestType, userId) => {
    return (dispatch) => {
        dispatch(sendMoneyRequestStart());
        return axios.post('/chat/moneyrequests/user', {
            Amount: amount, RequestType: requestType, UserId: userId
        }, {
            headers: getCommonHeaders()
        })
            .then(
                ({ data: { Result, Success } = {} }) => {
                    if (Success && Result) {
                        dispatch(sendMoneyRequestSuccess());
                    } else {
                        dispatch(sendMoneyRequestFailure(ERROR.MONEY_REQUEST));
                    }
                },
                ({ data: { Error } = {} }) => {
                    dispatch(sendMoneyRequestFailure(Error || ERROR.MONEY_REQUEST));
                }
            );
    };
};
// endregion

// region Получить ботов
/**
 * Get bots.
 */
export const getBots = () => {
    return (dispatch, getState) => {
        const { auth: { sessionToken: token } = {} } = getState();
        dispatch(getBotsStart());
        return axios.get('chat/bots?personalized=true', {
            headers: {
                SessionToken: token
            }
        })
            .then(
                ({ data: { Result, Success } = {} }) => {
                    if (Success && Result) {
                        dispatch(getBotsSuccess(Result));
                    } else {
                        dispatch(getBotsFailure(ERROR.GET_BOTS));
                    }
                },
                ({ data: { Error } = {} }) => {
                    dispatch(getBotsFailure(Error || ERROR.GET_BOTS));
                }
            );
    };
};

// endregion

/**
 * Get chat messages.
 * @param {string} chatId - Id of the chat.
 * @param {string} dateFrom - date for limit count.
 * @param {number} limit - limit for messages.
 * @param {number} direction - sort direction.
 * @param {string} token - Session token.
 * @return {Promise} Promise object.
 */
function getMessagesRequest (chatId, dateFrom, limit, direction, token) {
    let url = `chat/chats/${chatId}/messages`;
    let params = '';
    if (dateFrom) {
        params += `&dateFrom=${dateFrom}`;
    }
    if (limit) {
        params += `&limit=${limit}`;
    }
    if (direction) {
        params += `&direction=${direction}`;
    }
    if (params) {
        url += `?${params.substring(1)}`;
    }

    return axios({
        method: 'get',
        url,
        headers: {
            SessionToken: token
        }
    });
}


// region Получить предыдущие сообщения
/**
 * Get previous messages with default limit.
 */
export function getPreviousMessages () {
    return (dispatch, getState) => {
        const {
            chat: {
                messages: msgs,
                currentChat: { Id: chatId } = {}
            } = {}
        } = getState();

        dispatch(addPreviousMessagesStart());
        if (!chatId) {
            dispatch(addPreviousMessagesFailure(ERROR.PREVIOUS_MESSAGES));
            return Promise.reject();
        }

        const messages = msgs[chatId];
        if (!messages) {
            dispatch(addPreviousMessagesFailure(ERROR.PREVIOUS_MESSAGES));
            return Promise.reject();
        }

        let dateCreated = messages[0].DateCreated;
        if (!dateCreated) {
            dispatch(addPreviousMessagesFailure(ERROR.PREVIOUS_MESSAGES));
            return Promise.reject();
        }
        dateCreated = new Date(dateCreated);
        dateCreated = dateCreated.toISOString();

        return getMessagesRequest(chatId, dateCreated, 30, 0, getState().auth.sessionToken)
            .then(({ data: { Result } = {} }) => {
                if (Result) {
                    dispatch(addPreviousMessagesSuccess(Result));
                } else {
                    dispatch(addPreviousMessagesFailure(ERROR.PREVIOUS_MESSAGES));
                }
            }, ({ data: { Error } = {} }) => {
                dispatch(addPreviousMessagesFailure(Error || ERROR.PREVIOUS_MESSAGES));
            });
    };
}

// endregion

// region Пометить чат как прочитанный
/**
 * Mark chat as read by chat id.
 * @param {string} chatId.
 */
export function markChatAsRead (chatId) {
    return (dispatch, getState) => {
        return axios({
            method: 'post',
            url: `chat/chats/${chatId}/read`,
            headers: {
                SessionToken: getState().auth.sessionToken
            }
        }).then(({ data: { Success } = {} }) => {
            if (Success) {
                dispatch(markRead(chatId));
            }
        });
    };
}

// endregion

/**
 * Создает приватный чат с пользователем.
 * @param userId - bankOkId - собеведника.
 * @param message - первое сообщение пользователю.
 */
const createUserChat = (userId, message) => {
    return (dispatch, getState) => {
        if (!userId || !message) {
            dispatch(createUserChatFailure(ERROR.CREATE_USER_CHAT));
            return Promise.reject();
        }

        const { auth: { sessionToken: token } = {} } = getState();
        dispatch(createUserChatStart());
        return axios({
            method: 'post',
            url: `chat/chats/user-${userId}/messages`,
            data: {
                Text: message,
                CId: uuid()
            },
            headers: {
                SessionToken: token
            }
        })
            .then(
                (response) => {
                    const { data: { Result, Success } = {} } = response;
                    if (Success && Result) {
                        dispatch(createUserChatSuccess(Result));
                        return Promise.resolve(Result);
                    }
                    dispatch(createUserChatFailure(ERROR.CREATE_USER_CHAT));
                    return Promise.reject();
                },
                (response) => {
                    const { data: { Error } = {} } = response;
                    dispatch(createUserChatFailure(Error || ERROR.CREATE_USER_CHAT));
                    return Promise.reject();
                }
            );
    };
};

// region Отправить сообщение
/**
 * Send messages by chat id, creates new chat if not any.
 * @param {string} message.
 * @param {string} chatId.
 * @param {boolean} chatIsDummy - является ли чат заглушкой.
 */
export function sendChatMessage (message, chatId, chatIsDummy) {
    return async (dispatch, getState) => {
        const { auth: { sessionToken: token } = {} } = getState();
        dispatch(sendMessageStart());
        if (!message) {
            dispatch(sendMessageFailure(ERROR.SEND_MESSAGE));
            return Promise.reject();
        }

        if (chatId && !chatIsDummy) {
            return axios({
                method: 'post',
                url: `chat/chats/${chatId}/messages`,
                data: {
                    Text: message,
                    CId: uuid()
                },
                headers: {
                    SessionToken: token
                }
            }).then(
                ({ data: { Success } = {} }) => {
                    if (Success) {
                        dispatch(sendMessageSuccess());
                    } else {
                        dispatch(sendMessageFailure(ERROR.SEND_MESSAGE));
                    }
                },
                ({ data: { Error } = {} }) => {
                    dispatch(sendMessageFailure(Error || ERROR.SEND_MESSAGE));
                }
            );
        }

        // пытаемся создать и получить новый чат
        if (!chatId) {
            dispatch(sendMessageFailure(ERROR.SEND_MESSAGE));
            return Promise.reject();
        }

        try {
            // возвращает сообщение с id нового чата
            await dispatch(createUserChat(chatId, message));
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.log(e);
            }
        }

        dispatch(getChats());
        dispatch(sendMessageSuccess());
        return Promise.resolve();
    };
}

// endregion

