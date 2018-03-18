import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import cx from 'classnames';
import PreventParentScoll from 'prevent-parent-scroll';
import { noop, get } from 'lodash';
import moment from 'moment';
import s from './ChatPanel.component.css';
import ChatMessage from '../ChatMessage/ChatMessage.component';
import { Icon } from '../Icons';
import transfer from './transfer.svg';
import request from './request.svg';
import { AmountTextbox } from '../../components/Forms/AmountTextbox/AmountTextbox.component';
import Btn from '../../components/UI/Buttons/Btn/Btn.component';
import { getColor, toShortName, getMessageData } from '../../actions/chat';


class Chat extends PureComponent {
    static propTypes = {
        userId: PropTypes.string,
        className: PropTypes.string,
        sendChatMessage: PropTypes.func,
        openTransfer: PropTypes.func,
        getPreviousMessages: PropTypes.func,
        sendMoneyRequest: PropTypes.func,
        openTransferFromMessage: PropTypes.func,
        clearPreviousMessages: PropTypes.func,
        // функция для какой-либо инициализации
        markChatAsRead: PropTypes.func,
        isLoading: PropTypes.bool,
        // необходимо для внутренних целей
        opened: PropTypes.bool,
        messages: PropTypes.arrayOf(PropTypes.shape({})),
        currentChat: PropTypes.shape({}),
    };

    static defaultProps = {
        sendChatMessage: noop,
        getPreviousMessages: noop,
        clearPreviousMessages: noop,
        sendMoneyRequest: noop,
        openTransferFromMessage: noop,
        openTransfer: noop,
        markChatAsRead: noop,
        isLoading: false,
        opened: false,
        messages: undefined,
        userId: '',
        currentChat: undefined,
        className: '',
    };

    constructor (props) {
        super(props);
        this.state = { value: '', showRequestInput: false, requestAmount: undefined };
    }

    componentDidMount () {
        const { chatContainer, scrollInitialized } = this;
        if (chatContainer && !scrollInitialized) {
            chatContainer.addEventListener('scroll', this.handleScroll);
            this.preventParentScroll = new PreventParentScoll(chatContainer);
            this.preventParentScroll.start();
            this.scrollInitialized = true;
        }
    }

    componentWillReceiveProps (nextProps) {
        const id = get(this.props, 'currentChat.Id');
        const nextId = get(nextProps, 'currentChat.Id');

        if (nextId && id !== nextId) {
            this.scrolled = false;
            this.setState({ value: '' });
        }
        if (id && !nextId) {
            this.props.markChatAsRead(id);
            this.setState({ showRequestInput: false, requestAmount: undefined });
        }
    }

    componentWillUpdate () {
        if (!this.chatContainer) return;
        const { scrollHeight, offsetHeight, scrollTop } = this.chatContainer;
        if (scrollHeight) {
            if (scrollHeight > offsetHeight) {
                // сохраняем позицию скролла для загрузки предыдущих сообщений
                this.chatScrollBottom = scrollHeight - scrollTop;
            }

            this.scrollIsAtBottom = scrollHeight - offsetHeight - scrollTop < 5;
        }
    }

    componentDidUpdate () {
        const { messages, opened } = this.props;
        if (!messages || !messages.length || !this.chatContainer || !opened) return;
        if (!this.scrolled) {
            const unread = this.el.querySelectorAll('.unread');
            if (unread.length > 1) {
                unread[0].scrollIntoView(true);
            } else {
                this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
            }

            this.scrolled = true;
        } else if (this.scrollToBottom) {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
            this.scrollToBottom = false;
        } else if (this.scrollIsAtBottom) {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        } else if (this.chatScrollBottom && this.chatContainer) {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight - this.chatScrollBottom;
        }

        if (opened && window.innerWidth > 1024) {
            if (this.state.showRequestInput) {
                const reqAmountInput = this.el.querySelector(`.${s.controlsContainer} input`);
                if (reqAmountInput) {
                    reqAmountInput.focus();
                }
            } else {
                this.input.focus();
            }
        }
    }

    componentWillUnmount () {
        this.chatContainer.removeEventListener('scroll', this.handleScroll);
        if (this.preventParentScroll) {
            this.preventParentScroll.stop();
        }
    }

    setValue = (e) => {
        this.setState({ value: e.target.value });
    };

    handleScroll = () => {
        clearTimeout(this.loadTimer);
        const { scrollHeight, clientHeight, scrollTop } = this.chatContainer;
        const { isLoading, getPreviousMessages, clearPreviousMessages } = this.props;
        if (scrollHeight > clientHeight && !isLoading) {
            let scrollHandler;
            if (scrollTop < 10) {
                scrollHandler = getPreviousMessages;
            } else if (scrollHeight - scrollTop - clientHeight < 5) {
                scrollHandler = clearPreviousMessages;
            }
            if (scrollHandler) {
                this.loadTimer = setTimeout(() => {
                    scrollHandler();
                }, 100);
            }
        }
    };

    sendMessage = (e) => {
        if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
            const message = this.state.value;
            const { isLoading, sendChatMessage, currentChat } = this.props;
            if (!message || isLoading || !currentChat) return;

            this.scrollToBottom = true;
            sendChatMessage(message, currentChat.Id, currentChat.isDummy);
            this.setState({ value: '' });
        }
        this.input.focus();
    };

    sendMoneyRequest = (e) => {
        if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
            const {
                userId, isLoading,
                currentChat: { Users = [] } = {}, sendMoneyRequest
            } = this.props;
            const targetUser = Users.find(u => `${u.BankokId}` !== userId && u.BankokId !== 0);

            if (!isLoading && targetUser) {
                this.scrollToBottom = true;

                const requestType = this.state.requestAmount ? 0 : 3;
                sendMoneyRequest(this.state.requestAmount, requestType, targetUser.Id);
                this.setState({ showRequestInput: false, requestAmount: undefined });
            }
        }
    };

    transferEnabled = (currentChat) => {
        if (!currentChat) return false;
        const { Users, IsGroup, isBot } = currentChat;
        if (IsGroup) return false;
        const bot = Users.find(u => u.BankokId === 0);
        return !bot && !isBot;
    };

    requestEnabled = (currentChat = {}) => {
        const { Users = [], IsGroup, isBot } = currentChat;
        let res;
        if (!Users.length || IsGroup) {
            res = false;
        } else {
            const bot = Users.find(u => u.BankokId === 0);
            res = !bot && !isBot;
        }

        return res;
    };

    handleMoneyRequestInputChange = (e, requestAmount) => {
        this.setState({ requestAmount });
    };

    showMoneyRequestInput = () => {
        this.setState({ showRequestInput: true });
    };
    hideMoneyRequestInput = () => {
        this.setState({ showRequestInput: false, requestAmount: undefined });
    };

    onControlsContainerClick = (e) => {
        e.stopPropagation();
    };

    renderInput = () => {
        const { openTransfer, currentChat } = this.props;
        const transferEnabled = this.transferEnabled(currentChat);
        const requestEnabled = this.requestEnabled(currentChat);

        return (
            <div className={s.chatInputContainer}>
                <input
                    ref={(c) => {
                        this.input = c;
                    }}
                    onKeyUp={this.sendMessage}
                    onChange={this.setValue}
                    value={this.state.value}
                    className={cx(s.chatInput, s.centered, {
                        hidden: this.state.showRequestInput
                    })}
                    type="text"
                    placeholder="Cообщение…"
                />
                <button
                    onClick={this.sendMessage}
                    className={
                        cx(
                            s.sendBtn,
                            s.centered,
                            { hidden: !this.state.value },
                            'unstyled-button'
                        )
                    }
                >
                    <Icon
                        color="planeGreen"
                        icon="plane"
                        size={20}
                    />
                </button>
                <button
                    className={
                        cx(
                            'unstyled-button',
                            s.inputButton,
                            s.transferButton,
                            s.centered,
                            { hidden: !transferEnabled || this.state.value }
                        )
                    }
                    onClick={openTransfer}
                >
                    <img
                        src={transfer}
                        alt="Перевод"
                    />&nbsp;
                    <div>Перевести</div>
                </button>
                <button
                    className={
                        cx(
                            'unstyled-button',
                            s.inputButton,
                            s.requestButton,
                            s.centered,
                            { hidden: !requestEnabled || this.state.value }
                        )
                    }
                    onClick={this.showMoneyRequestInput}
                >
                    <img
                        src={request}
                        alt="Запрос"
                    />&nbsp;
                    <div>Запросить</div>
                </button>
            </div>
        );
    };

    renderMoneyRequest = () => {
        return (
            <div
                className={cx(s.requestAmountPage, { hidden: !this.state.showRequestInput })}
                onClick={this.hideMoneyRequestInput}
            >
                <div
                    className={s.controlsContainer}
                    onClick={this.onControlsContainerClick}
                >
                    <AmountTextbox
                        id="moneyRequestInput"
                        name="moneyRequestInput"
                        value={this.state.requestAmount}
                        onChange={this.handleMoneyRequestInputChange}
                        containerClassName={s.requestAmountInput}
                        isInvalid={false}
                        placeholder="Введите сумму"
                        onKeyUp={this.sendMoneyRequest}
                    />
                    <div className={s.buttonContainer}>
                        <Btn
                            onClick={this.sendMoneyRequest}
                            text={this.state.requestAmount ? 'Запросить' : 'Запросить любую сумму'}
                            className={s.sendRequest}
                        />
                        <button
                            className={cx(s.cancelRequest, 'unstyled-button')}
                            onClick={this.hideMoneyRequestInput}
                        >Отмена
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    getAvatar = (author = {}) => {
        const { DisplayName, Avatar: url } = author;
        if (url) return { type: 'url', param: url };
        return { type: 'name', param: toShortName(DisplayName) };
    };

    buildMessage = (message) => {
        const {
            userId, openTransferFromMessage, currentChat: {
                LastUnreadMessageTime, IsGroup
            } = {}
        } = this.props;

        const unreadTime = LastUnreadMessageTime;

        const authorPhone = get(message, 'Author.Phone');
        const requestAmount = get(message, 'Attachment.MoneyRequest.Amount');
        const date = get(message, 'DateCreated');
        const bankokId = get(message, 'Author.BankokId');
        const displayName = get(message, 'Author.DisplayName');
        const type = get(message, 'Attachment.Type');

        const { type: avatarType, param: avatarParam } = this.getAvatar(message.Author);

        const format = date.year() === moment().year() ? 'DD.MM в HH:mm' : 'DD.MM.YYYY HH:mm';
        const time = date.format(format);
        const color = getColor(displayName);

        const { isUserMessage, messageText, amountText } = getMessageData({
            message, userId, isGroup: IsGroup,
        });

        return (
            <ChatMessage
                unread={unreadTime ? unreadTime.isSame(message.DateCreated) : false}
                userId={userId}
                key={message.Id}
                chatIsGroup={IsGroup}
                onRequestClick={openTransferFromMessage}
                authorPhone={authorPhone}
                requestAmount={requestAmount}
                authorBankokId={bankokId}
                type={type}
                time={time}
                color={color}
                avatarType={avatarType}
                avatarParam={avatarParam}
                isUserMessage={isUserMessage}
                messageText={messageText}
                amountText={amountText}
            />
        );
    };

    renderMessages = () => {
        const { messages, userId, currentChat } = this.props;
        let msgs;
        if (currentChat && userId && messages) {
            msgs = messages.map(this.buildMessage);
        }

        return (
            <div
                ref={(c) => {
                    this.chatContainer = c;
                }}
                className={cx(s.chatContent, s.smooth)}
            >{msgs}
            </div>
        );
    };

    render () {
        const { className } = this.props;
        return (
            <div
                ref={(c) => {
                    this.el = c;
                }}
                className={cx(s.root, className)}
            >
                {this.renderMoneyRequest()}
                {this.renderMessages()}
                {this.renderInput()}
            </div>
        );
    }
}

export default withStyles(s)(Chat);
