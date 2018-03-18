import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { noop } from 'lodash';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './ChatGroup.component.css';
import ChatItem from './ChatItem.component';
import { getName, getChatAvatar, getMessageData, emojiRegEx } from '../../actions/chat';

/**
 * Компонент выделения групп в чате.
 * @param props.header - заголовок.
 */
class ChatGroup extends PureComponent {
    static propTypes = {
        header: PropTypes.string,
        userId: PropTypes.string,
        onChatSelect: PropTypes.func,
        chats: PropTypes.arrayOf(PropTypes.shape({})),
    };
    static defaultProps = {
        header: '',
        userId: '',
        onChatSelect: noop,
        chats: [],
    };

    render () {
        const {
            header, chats,
            userId, onChatSelect
        } = this.props;

        return (
            <div>
                <div className={s.root}>{header}</div>
                {chats.map((chat) => {
                    const {
                        Id, IsGroup, Users,
                        LastMessage = {}, UnreadMessagesCount
                    } = chat;
                    const name = getName(chat, userId);
                    const { type, param } = getChatAvatar(IsGroup, Users, userId, name);

                    const { messageText, amountText, type: msgType } = getMessageData({
                        message: LastMessage,
                        userId,
                        isGroup: IsGroup,
                    });
                    let lastMessageText = msgType === 3 ? messageText : `${messageText} ${amountText.toLowerCase()}`;

                    // временно удаляем emoji из-за отсутствия авторских прав
                    lastMessageText = lastMessageText.replace(emojiRegEx, '');

                    return (
                        <ChatItem
                            key={Id}
                            chatId={Id}
                            userId={userId}
                            onClick={onChatSelect}
                            isGroup={IsGroup}
                            UnreadMessagesCount={UnreadMessagesCount}
                            name={name}
                            type={type}
                            param={param}
                            lastMessageDateCreated={LastMessage.DateCreated}
                            lastMessageText={lastMessageText}
                        />
                    );
                })}
            </div>
        );
    }
}

export default withStyles(s)(ChatGroup);
