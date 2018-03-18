import sanitizeHtml from 'sanitize-html';
import moment from 'moment';
import anchorme from 'anchorme';
import { get } from 'lodash';
import { getHash, formatAmount, generateId } from '../../core/utils';
import { avatarColors } from '../../constants/internal/index';
import { windowScroll } from '../../core/DOMUtils';


/**
 * Для поиска emoji.
 * @type {RegExp}
 */
export const emojiRegEx = /((?:([\u0023|\u002a|\u0030-\u0039|\u00a9|\u00ae|\u203c|\u2049|\u20e3|\u2122|\u2139|\u2194-\u2199|\u21a9-\u21aa]\ufe0f)|\u200d|\u200c|[\u231a-\u231b]|[\u2328]|[\u23cf]|[\u23e9-\u23f3]|[\u23f8-\u23fa]|[\u24c2]|[\u25aa-\u25ab]|[\u25b6]|[\u25c0]|[\u25fb-\u25fe]|[\u2600-\u2604]|[\u260e]|[\u2611]|[\u2614-\u2615]|[\u2618]|[\u261d]|[\u2620]|[\u2622-\u2623]|[\u2626]|[\u262a]|[\u262e-\u262f]|[\u2638-\u263a]|[\u2640]|[\u2642]|[\u2648-\u2653]|[\u2660]|[\u2663]|[\u2665-\u2666]|[\u2668]|[\u267b]|[\u267f]|[\u2692-\u2697]|[\u2699]|[\u269b-\u269c]|[\u26a0-\u26a1]|[\u26aa-\u26ab]|[\u26b0-\u26b1]|[\u26bd-\u26be]|[\u26c4-\u26c5]|[\u26c8]|[\u26ce-\u26cf]|[\u26d1]|[\u26d3-\u26d4]|[\u26e9-\u26ea]|[\u26f0-\u26f5]|[\u26f7-\u26fa]|[\u26fd]|[\u2702]|[\u2705]|[\u2708-\u270d]|[\u270f]|[\u2712]|[\u2714]|[\u2716]|[\u271d]|[\u2721]|[\u2728]|[\u2733-\u2734]|[\u2744]|[\u2747]|[\u274c]|[\u274e]|[\u2753-\u2755]|[\u2757]|[\u2763-\u2764]|[\u2795-\u2797]|[\u27a1]|[\u27b0]|[\u27bf]|[\u2934-\u2935]|[\u2b05-\u2b07]|[\u2b1b-\u2b1c]|[\u2b50]|[\u2b55]|[\u3030]|[\u303d]|[\u3297]|[\u3299]|[\ud83c-\ud83e]|[\udb40]|[\udc00-\udcfd]|[\udcff-\udd3e]|[\udd40-\udd45]|[\udd47-\udd4e]|[\udd50-\udd6b]|[\udd6f-\udd71]|[\udd73-\udd7a]|[\udd7e-\udd9a]|[\udda4-\udda5]|[\udda8]|[\uddb1-\uddb2]|[\uddbc]|[\uddc0]|[\uddc2-\uddc4]|[\uddd0-\ude51]|[\ude80-\udec5]|[\udecb-\uded2]|[\udee0-\udee5]|[\udee9]|[\udeeb-\udeec]|[\udef0]|[\udef3-\udef8]|[\udf00-\udf21]|[\udf24-\udf93]|[\udf96-\udf97]|[\udf99-\udf9b]|[\udf9e-\udff0]|[\udff3-\udff5]|[\udff7-\udfff])+)/;

/**
 * Приводит имя к аббревиатуре для отображения в аватаре.
 * @param {string} chatName.
 * @returns {string}.
 */
export const toShortName = (chatName) => {
    let name = '';
    if (chatName) {
        name = chatName.trim();
    }
    const [firstName, secondName] = name.split(/\s+/);
    if (!secondName) {
        if (/^\d\d.*/.test(firstName)) {
            return firstName.substring(0, 2);
        }

        return firstName.charAt(0).toUpperCase();
    }

    const firstChar = firstName.charAt(0);
    const secondChar = secondName.charAt(0);

    if (firstChar === firstChar.toUpperCase() && secondChar === secondChar.toUpperCase()) {
        return firstChar + secondChar;
    }

    return firstChar.toUpperCase();
};

/**
 * Возвращает конфиг для создания аватары чата.
 * @param {boolean} isGroup - Флаг является ли чат групповым.
 * @param {Array }users - Массив участников чата.
 * @param {string} userId - BankokId текущего пользователя.
 * @param {string} name - Имя для отображения в аватаре.
 */
export const getChatAvatar = (isGroup, users, userId, name) => {
    let chatName = name && name.trim();
    if (!isGroup) {
        const notMe = users.find(user => (`${user.BankokId}` !== userId)) || {};
        const { Avatar: url, AvatarUrl, DisplayName } = notMe;
        if (url || AvatarUrl) return { type: 'url', param: url || AvatarUrl };
        chatName = chatName || DisplayName;
    }

    return { type: 'name', param: toShortName(chatName) };
};

/**
 * Выдает однозначный цвет по строке.
 * @param {string} name.
 */
export const getColor = (name) => {
    const hash = getHash(name);
    const index = hash % avatarColors.length;
    return avatarColors[index];
};

/**
 * Получить имя чата.
 * @param {object} chat
 * @param {string} userId
 */
export const getName = (chat, userId) => {
    const { Name, Users = [] } = chat;

    let name = 'Чат с друзьями';
    if (Name) {
        name = Name;
    } else if (Users.length < 3) {
        const { DisplayName } = Users.find(({ BankokId }) => (`${BankokId}` !== userId)) || {};
        if (DisplayName) {
            name = DisplayName;
        }
    }

    return name;
};

/**
 * Выдает рандомный цвет.
 * @returns {string}
 */
export const generateColor = () => {
    const map = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    const randomInt = (min, max) => {
        return Math.floor((Math.random() * ((max - min) + 1)) + min);
    };

    let color = '#';
    for (let i = 0; i < 6; i += 1) {
        color += map[randomInt(4, 12)];
    }

    return color;
};

/**
 * Строит данные для отображения сообщения.
 * @returns {object}
 */
export const getMessageData = (params) => {
    const { message, userId, isGroup } = params;
    let messageText = get(message, 'Text'); // Текст сообщения
    let amountText = '';

    const authorId = get(message, 'Author.BankokId'); // Идентификатор пользователя в основном банкоке
    const authorName = get(message, 'Author.DisplayName'); // Отображаемое имя пользователя
    const authorGender = get(message, 'Author.Gender'); // Пол пользователя(0=None 1=Male 2=Female ) = ['0', '1', '2']
    const authorPhone = get(message, 'Author.Phone');

    const type = get(message, 'Attachment.Type', undefined); // 0=File   1=Transfer 2=MoneyRequest 3=System 4=Widget

    const transferAmount = get(message, 'Attachment.Transfer.Amount'); // Сумма перевода
    const transferId = get(message, 'Attachment.Transfer.TransferId'); // Идентификатор перевода в банкок
    const transferCurrency = get(message, 'Attachment.Transfer.Currency'); // Валюта перевода

    const requestAmount = get(message, 'Attachment.MoneyRequest.Amount'); //  Сумма запроса с учётом типа запроса
    const requestType = get(message, 'Attachment.MoneyRequest.RequestType'); // 0=SingleUser 1=AmountPerUser 2=SplitAmountBetweenUsers 3=WithoutAmount
    const requestFullAmount = get(message, 'Attachment.MoneyRequest.FullAmount'); // Общая сумма запроса

    const systemVisible = get(message, 'Attachment.System.Visible'); // Показывать ли данное сообщение ,
    const systemAttachmentType = get(message, 'Attachment.System.SystemAttachmentType'); // Тип системного сообщения(1=GroupCreated ) = ['1']

    const widgetData = get(message, 'Attachment.Widget.Data'); // Показывать ли данное сообщение?????
    const widgetType = get(message, 'Attachment.Widget.WidgetType'); // Тип системного сообщения(0=CardInfo 1=Transfer 2=BrokerInvestments ) = ['0', '1', '2']
    const isUserMessage = `${authorId}` === userId;

    switch (type) {
        case 1:
            if (isUserMessage) {
                messageText = 'Вы перевели';
            } else {
                messageText = `Перевел${authorGender === 2 ? 'а' : ''} вам`;
            }
            amountText = `${formatAmount(transferAmount, transferCurrency)}`;
            break;

        case 2:
            if (isUserMessage) {
                messageText = 'Вы запросили';
            } else if (!isGroup) {
                messageText = `Запросил${authorGender === 2 ? 'а' : ''} у вас`;
            } else {
                messageText = `${authorName} запросил${authorGender === 2 ? 'а' : ''} у вас`;
            }

            amountText = requestAmount ? `${formatAmount(requestAmount, 'RUB')}` : 'Произвольную сумму';
            break;

        case 3:
            if (systemVisible && systemAttachmentType === 1) {
                messageText = `${authorName} создал${authorGender === 2 ? 'а' : ''} чат`;
            }
            break;
        default:
            if (!messageText || messageText === 'null') {
                messageText = 'Неподдерживаемый виджет';
            }
            break;
    }

    return {
        isUserMessage,
        messageText,
        amountText,
        type
    };
};


/**
 * Управление скроллом на мобильных устройствах.
 * @param {boolean} scroll - быть или не быть.
 */
export const mobileEnableScroll = (scroll) => {
    const { innerWidth, innerHeight } = window || {};
    if (!innerWidth || !innerHeight) return;
    const d = Math.min(innerWidth, innerHeight);

    if (d < 640 && !scroll) {
        windowScroll(false);
        return;
    }
    windowScroll(true);
};


const processMessageText = (text, parser) => {
    const textWithLinks = anchorme(text || '', {
        attributes: [
            function (urlObj) {
                if (urlObj.protocol !== 'mailto:') {
                    return { name: 'target', value: 'blank' };
                }
                return {};
            }
        ]
    });

    const textWithEmoji = parser.textToHtml(textWithLinks || '');
    return sanitizeHtml(textWithEmoji, {
        allowedTags: [],
        allowedAttributes: {}
    });
};

export const escapeMessage = (message, parser) => {
    const Text = processMessageText(message.Text, parser);
    return { ...message, Text };
};

export const escapeMessages = (messages, parser) => {
    return messages.map(m => escapeMessage(m, parser));
};

/** Build data for support chat message receive event.
 * @param {object} state - app global state.
 * @param {object} message - chat message.
 * @returns {object} data to push.
 * */
export const createMessageReceiveEvent = (message, state) => {
    const { chat: { bots, chats = [] } = {} } = state;
    const { ChatId, Author: { BankokId: authorId } = {} } = message;

    const messageChat = chats.find(chat => chat.Id === ChatId);
    if (!bots || !bots.length || !messageChat) return null;

    let chatType = 'чат с пользователем';
    let withText;
    if (chats && bots) {
        const messageChatBot = messageChat.Users.find(u => u.BankokId === 0);
        if (messageChatBot) {
            chatType = messageChatBot.DisplayName;
            withText = true;
        }
    }

    const timeStamp = new Date().getTime();
    const eventName = authorId === 0 ? 'operator chat message sent' : 'user chat message sent';

    const storage = window.localStorage;
    if (!eventName || !storage) return null;

    // previous data;
    const storageSupportChatConversationId = storage.getItem('storageSupportChatConversationId');
    const storageSupportChatChatId = storage.getItem('storageSupportChatChatId');
    const storageSupportChatTimeStamp = +storage.getItem('storageSupportChatTimeStamp');

    let conversationId;
    // new conversation id if
    if (!storageSupportChatConversationId
        || !storageSupportChatChatId
        || !storageSupportChatTimeStamp
        || timeStamp - storageSupportChatTimeStamp > 30 * 60 * 1000
        || storageSupportChatChatId !== messageChat.Id) {
        conversationId = generateId();
    }

    if (conversationId) {
        storage.setItem('storageSupportChatConversationId', conversationId);
        storage.setItem('storageSupportChatChatId', messageChat.Id);
    }

    storage.setItem('storageSupportChatTimeStamp', timeStamp);

    const eventObj = {
        chatType,
        event: eventName,
        chatConversationId: conversationId || storageSupportChatConversationId
    };

    if (withText) {
        let text = message.Text || '';
        if (text.length > 256) {
            text = `${text.substring(0, 256)}...`;
        }

        eventObj.chatMessage = text;
    }

    if (eventName === 'operator chat message sent') {
        eventObj.chatIsBotOperator = false;
    }

    eventObj.timestampCreated = moment.isMoment(message.DateCreated)
        ? message.DateCreated.valueOf()
        : moment(message.DateCreated).valueOf();
    eventObj.sender = message.Author.BankokId === 0 ? 'оператор' : 'пользователь';

    return eventObj;
};


/** Modify object instanciating date fields.
 * @param {object} obj - object to modify.
 * @param {string} fieldName - date field name.
 * @returns {object} modified object.
 * */
const instanciateDateField = (fieldName, obj) => {
    return { ...obj, [fieldName]: moment(obj[fieldName]) };
};

/** Get chat with parsed LastUnreadMessageTime time.
 * @param {object} chat - chat.
 * @returns {object} chat with parsed LastUnreadMessageTime time.
 * */
export const getChatWithParsedTime = (chat) => {
    return instanciateDateField('LastUnreadMessageTime', chat);
};

/** Get message with parsed create time.
 * @param {object} message - message.
 * @returns {object} message with parsed create time.
 * */
export const getMessageWithParsedTime = (message) => {
    return instanciateDateField('DateCreated', message);
};

/** Get array of messages with parsed create time.
 * @param {array} messages - array of messages.
 * @returns {array} array of messages with parsed create time.
 * */
export const getMessagesWithParsedTime = (messages) => {
    return messages.map(m => getMessageWithParsedTime(m));
};

/** Get array of chats with parsed LastUnreadMessageTime time.
 * @param {array} chats - array of chats.
 * @returns {array} array of chats with parsed LastUnreadMessageTime time.
 * */
export const getChatsWithParsedTime = (chats) => {
    return chats.map(c => getChatWithParsedTime(c));
};
