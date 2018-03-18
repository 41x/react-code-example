import React, { Fragment } from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';
import { noop } from 'lodash';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './ChatMessage.component.css';
import Avatar from '../../components/ChatList/Avatar.component';
import { Icon } from '../Icons';
import { Link } from '../Link/Link';

class Message extends React.PureComponent {
    static propTypes = {
        authorPhone: PropTypes.string,
        authorBankokId: PropTypes.number,
        time: PropTypes.string,
        amountText: PropTypes.string,
        color: PropTypes.string,
        messageText: PropTypes.string,
        avatarParam: PropTypes.string,
        avatarType: PropTypes.string,
        unread: PropTypes.bool.isRequired,
        isUserMessage: PropTypes.bool,
        onRequestClick: PropTypes.func,
        requestAmount: PropTypes.number,
        type: PropTypes.number,
    };

    static defaultProps = {
        onRequestClick: noop,
        authorPhone: undefined,
        requestAmount: undefined,
        authorBankokId: undefined,
        avatarType: undefined,
        color: undefined,
        avatarParam: undefined,
        time: undefined,
        isUserMessage: undefined,
        messageText: '',
        amountText: '',
        type: undefined,
    };

    onRequest = () => {
        const { authorPhone, requestAmount } = this.props;
        this.props.onRequestClick(authorPhone, requestAmount);
    };

    buildContent = () => {
        let content;
        const {
            isUserMessage, messageText,
            amountText, type
        } = this.props;

        if (type === 3 || type === undefined) {
            content = <span>{messageText}</span>;
        } else {
            content = (
                <Fragment>
                    <span className={s.header}>{messageText}</span><br />
                    <span>{amountText}</span>
                    {!isUserMessage && type === 2 &&
                    <Fragment>
                        <hr className={s.divider} />
                        <Link
                            onClick={this.onRequest}
                            className={s.link}
                        >
                            Перевести
                        </Link>
                    </Fragment>
                    }
                </Fragment>
            );
        }

        return content;
    };

    render () {
        const {
            unread, authorBankokId, isUserMessage,
            type, time, color, avatarType, avatarParam
        } = this.props;

        const content = this.buildContent();
        let view;
        if (type === 3) {
            view = (
                <div className={s.systemMessage}>{content}</div>
            );
        } else if (isUserMessage) {
            view = (
                <div className={s.chatRightMessageContainer}>
                    <div className={cx(s.chatRightMessage, s.wrap)}>
                        {content}
                    </div>
                    <div className={s.chatRightMessageInfo}>
                        <span>
                            <Icon
                                color="planeGreen"
                                icon="check"
                                size={20}
                            />
                        </span>
                        <span>{time}</span>
                    </div>
                </div>
            );
        } else {
            view = (
                <div className={cx(s.chatLeftMessageContainer, unread ? 'unread' : '')}>
                    <div className={s.companionAvatar}>
                        <Avatar
                            type={avatarType}
                            param={avatarParam}
                            size={40}
                            color={color}
                        />
                    </div>
                    <div className={cx(s.chatLeftMessage, s.wrap)}>
                        {content}
                    </div>
                    <div className={s.chatLeftMessageInfo}>
                        {!authorBankokId && <span className={s.companionPosition}>Банк</span>}
                        {!authorBankokId &&
                        <div
                            className={cx(s.companionIndicator, s.companionIndicator_active)}
                        />}
                        <span>{time}</span>
                    </div>
                </div>
            );
        }

        return view;
    }
}

export default withStyles(s)(Message);
