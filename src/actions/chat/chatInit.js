import {
    getChat,
    createMessageReceiveEvent,
    showChatBtn,
    newWebSocketMessage,
    addChat,
    getChats,
    getBots
} from '../chat';
import { baseUrl } from '../../core/axios';
import * as analytics from '../../core/analytics.v2';


/**
 * Connect to signalR.
 * @param {string} url - SignalR url.
 * @param {string} hubName - Hub name.
 * @param {Array} handlers - Array of {event: "eventName", handler: function}.
 * @param {string} token - Session token.
 */
const subscribeToSignalR = (url, hubName, handlers, token) => {
    require('../../../tools/lib/jquery.1.8.0.min');
    require('../../../tools/lib/jquery.signalR-2.2.1');

    const connection = $.hubConnection(url);

    connection.qs = { sessionToken: token };

    const hubProxy = connection.createHubProxy(hubName);

    handlers.forEach((h) => {
        hubProxy.on(h.event, h.handler);
    });

    connection.start()
        .done(() => {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`SignalR connection ID=${connection.id}`);
            }
        })
        .fail((e) => {
            if (process.env.NODE_ENV !== 'production') {
                console.dir(e);
            }
        });
};

const subscribeToChatEvents = () => {
    return (dispatch, getState) => {
        const url = `${baseUrl}chat`;

        const handlers = [];
        handlers.push({
            event: 'OnNewMessage',
            handler: (message) => {
                const { user: { Uid } = {}, chat: { currentChat } } = getState();
                const { Attachment, ChatId, Author: { BankokId } = {} } = message;

                dispatch(newWebSocketMessage({ chatId: ChatId, message }));

                if (!currentChat) {
                    dispatch(getChat(ChatId));
                }
                // for gtm
                if ((Uid === `${BankokId}` || BankokId === 0) && !Attachment) {
                    setTimeout(() => {
                        analytics.other.chat({
                            data: createMessageReceiveEvent(message, getState())
                        });
                    }, 100);
                }
            }
        });
        handlers.push({
            event: 'OnChatCreated',
            handler: (newChat) => {
                dispatch(addChat(newChat));
            }
        });

        subscribeToSignalR(url, 'ChatHub', handlers, getState().auth.sessionToken);
    };
};


/**
 * Initializes chat filling state with available bots and chats.
 * @param {function} dispatch - store dispatch function.
 * @return {Promise} Promise object.
 */
const initChat = (dispatch) => {
    return new Promise(async (res, rej) => {
        try {
            // get bots
            await dispatch(getBots());
            // get chats
            dispatch(getChats());
            res();
        } catch (ex) {
            rej(ex);
        }
    });
};

/**
 * Initializes support chat after componentDidMount event.
 * @return {Function} Promise object.
 */
export const initializeChat = () => {
    return async (dispatch) => {
        await initChat(dispatch);
        dispatch(subscribeToChatEvents());
        dispatch(showChatBtn(true));
    };
};

