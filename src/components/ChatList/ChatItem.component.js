import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import moment from 'moment';
import cx from 'classnames';
import { noop } from 'lodash';
import s from './ChatItem.component.css';
import Avatar from './Avatar.component';
import { getColor } from '../../actions/chat';


class ChatItem extends PureComponent {
    static propTypes = {
        UnreadMessagesCount: PropTypes.number,
        type: PropTypes.string,
        onClick: PropTypes.func,
        chatId: PropTypes.string,
        name: PropTypes.string,
        param: PropTypes.string,
        lastMessageText: PropTypes.string,
        lastMessageDateCreated: PropTypes.string,
    };

    static defaultProps = {
        chatId: undefined,
        onClick: noop,
        UnreadMessagesCount: 0,
        type: undefined,
        lastMessageDateCreated: '',
        name: '',
        param: '',
        lastMessageText: undefined,

    };

    onChatClick = () => {
        const { chatId } = this.props;
        if (chatId) {
            this.props.onClick(chatId);
        }
    };

    getMessageDate = (momentDate) => {
        const now = moment();
        const today = now.clone().startOf('day');
        const yesterday = now.clone().subtract(1, 'days').startOf('day');

        let messageDate;
        if (momentDate.isSame(today, 'd')) {
            messageDate = momentDate.format('HH:mm');
        } else if (momentDate.isSame(yesterday, 'd')) {
            messageDate = 'вчера';
        } else if (momentDate.year() === now.year()) {
            messageDate = momentDate.format('DD.MM');
        } else {
            messageDate = momentDate.format('DD.MM.YYYY');
        }

        return messageDate;
    };

    render () {
        const {
            UnreadMessagesCount, lastMessageDateCreated,
            name, type, param, lastMessageText
        } = this.props;

        const date = moment(lastMessageDateCreated);
        const lastActivity = this.getMessageDate(lastMessageDateCreated ? date : moment());

        const color = getColor(name);
        const text = lastMessageText.indexOf('Неподдерживаемый виджет') > -1 ? '' : lastMessageText;

        return (
            <div
                className={s.root}
                onClick={this.onChatClick}
            >
                <div className={cx(s.avatar, s.centered)}>
                    <Avatar
                        type={type}
                        param={param}
                        size={40}
                        color={color}
                        indicator={!!UnreadMessagesCount}
                    />
                </div>
                <div className={s.time}>
                    <span className={s.short}>{lastActivity}</span>
                </div>


                <div className={s.description}>
                    <div className={cx(s.name, s.short)}>{name}</div>
                    <div className={cx(s.message, s.short)}>{text}</div>
                </div>
            </div>
        );
    }
}

export default withStyles(s)(ChatItem);
