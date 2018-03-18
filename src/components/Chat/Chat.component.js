import React, { PureComponent, Fragment } from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import cx from 'classnames';
import queryString from 'query-string';
import s from './Chat.component.css';
import ChatPanel from '../../components/ChatPanel/ChatPanel.component';
import ChatList from '../../components/ChatList/ChatList.component';
import HeaderContent from './HeaderContent';
import toPortraitIcon from './toPortraitIcon.svg';
import history from '../../core/history';
import { defaultProps, propTypes } from './types';
import { getChatAvatar, getName, getColor, mobileEnableScroll } from '../../actions/chat';


class Chat extends PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor (props) {
        super(props);
        this.state = { searchMode: false, searchInput: '' };
    }

    componentDidMount () {
        this.props.initializeChat();
        window.addEventListener('orientationchange', this.updateScroll);

        const { screen: { width } = {} } = window;
        this.deviceWidth = width;
    }

    componentWillReceiveProps (nextProps) {
        const { opened } = this.props;
        const { opened: nextOpened, reOpen, chats = [] } = nextProps;

        if (reOpen && this.transferChatId) {
            //     открываем чат после перевода
            const chat = chats.find(c => c.Id === this.transferChatId);
            if (chat) {
                this.props.setActiveChat(chat);
                this.props.openChat();
                this.props.showChatBtn(true);
            }
            this.transferChatId = '';
        }

        const { currentChat: nextChat } = nextProps;
        const { currentChat } = this.props;
        if ((!currentChat && nextChat) || (opened && !nextOpened)) {
            this.setState({ searchMode: false, searchInput: '' });
        }
    }

    componentWillUnmount () {
        this.props.reset();
        window.removeEventListener('orientationchange', this.updateScroll);
    }

    updateState = (newState) => {
        this.setState(newState);
    };

    updateScroll = () => {
        mobileEnableScroll(!this.props.opened);
    };

    buildGroups = (supportChats = [], commonChats = []) => {
        const { searchInput } = this.state;
        const groups = [];

        if (supportChats.length) {
            groups.push({
                name: 'Служба поддержки',
                chats: supportChats
            });
        }

        if (commonChats.length) {
            let filteredChats;
            if (searchInput) {
                filteredChats = commonChats.filter(({ Name, Users = [] }) => {
                    let name = Name;
                    if (!name) {
                        Users.forEach((u) => {
                            if (u.DisplayName) {
                                name += u.DisplayName.toLowerCase();
                            }
                        });
                    }
                    return name.toLowerCase().indexOf(searchInput.toLowerCase()) > -1;
                });
            }

            const chats = filteredChats || commonChats;

            groups.push({
                name: 'Диалоги',
                chats
            });
        }

        return groups;
    };

    toChatList = () => {
        this.props.getChats();
        this.props.resetCurrentChat();
    };

    openTransferFromChat = () => {
        const { currentChat: { Users = [] } = {}, userId } = this.props;
        const notMe = Users.find(u => `${u.BankokId}` !== userId);

        if (notMe && Users.length === 2) {
            this.openTransferAndHideChatOnMobile(notMe.Phone);
        }
    };

    openTransferAndHideChatOnMobile = (phone, amount) => {
        const { currentChat: { Id } = {} } = this.props;
        const { innerWidth } = window;
        if (innerWidth < 640) {
            this.transferChatId = Id;
            this.props.setTransferInitiatorIsChat();
            this.props.hideChat();
            this.props.showChatBtn(false);
        } else if (innerWidth < 1367) {
            this.props.hideChat();
        }

        this.openTransfer(phone, amount);
    };

    openTransfer = (phone, amount) => {
        const params = {};
        if (phone) {
            params.destinationPhone = phone;
        }
        if (amount) {
            params.amount = amount;
        }

        const url = `/transfer?${queryString.stringify(params)}`;
        history.push(url);
    };

    setActiveChat = (chatId) => {
        const { chats, setActiveChat, supportChats } = this.props;
        let chat = chats.find(c => c.Id === chatId);
        if (!chat) {
            chat = supportChats.find(c => c.Id === chatId);
        }
        if (chat) {
            setActiveChat(chat);
        }
    };

    render () {
        const {
            isLoggedIn, opened, prevMsgLoading, chatIsLoading, botsLoading,
            sendMessageLoading, messagesLoading, chatsLoading, messages, userId,
            currentChat, hideChat, markChatAsRead, supportChats, commonChats,
            sendChatMessage, sendMoneyRequest, sendMoneyRequestLoading,
            getPreviousMessages, clearPreviousMessages
        } = this.props;

        const groups = this.buildGroups(supportChats, commonChats);
        const isLoading = prevMsgLoading
            || messagesLoading
            || chatsLoading
            || chatIsLoading
            || botsLoading
            || sendMoneyRequestLoading
            || sendMessageLoading;

        const isMobile = this.deviceWidth < 640;

        let name;
        let avatarParams;
        let color;
        if (currentChat) {
            const { IsGroup, Users } = currentChat;
            name = getName(currentChat, userId);
            avatarParams = getChatAvatar(IsGroup, Users, userId, name);
            color = getColor(name);
        }
        const { type, param } = avatarParams || {};

        return (
            <Fragment>
                <div
                    className={cx(s.root, {
                        [s.hidden]: !isLoggedIn || !opened
                    })}
                >
                    <div className={cx(s.headerContainer)}>
                        <HeaderContent
                            onClose={hideChat}
                            currentChat={!!currentChat}
                            onArrowClick={this.toChatList}
                            searchMode={this.state.searchMode}
                            searchInput={this.state.searchInput}
                            updateState={this.updateState}
                            name={name}
                            color={color}
                            type={type}
                            param={param}
                        />
                        <div className={cx(s.loader, { [s.showLoader]: isLoading })} />
                    </div>
                    <ChatPanel
                        className={!currentChat ? 'hidden' : ''}
                        userId={userId}
                        sendChatMessage={sendChatMessage}
                        getPreviousMessages={getPreviousMessages}
                        clearPreviousMessages={clearPreviousMessages}
                        markChatAsRead={markChatAsRead}
                        isLoading={isLoading}
                        isLoggedIn={isLoggedIn}
                        opened={opened}
                        messages={messages}
                        currentChat={currentChat}
                        openTransfer={this.openTransferFromChat}
                        openTransferFromMessage={this.openTransferAndHideChatOnMobile}
                        sendMoneyRequest={sendMoneyRequest}
                    />
                    <ChatList
                        className={currentChat ? 'hidden' : ''}
                        userId={userId}
                        groups={groups}
                        onChatSelect={this.setActiveChat}
                    />

                </div>
                {opened && isMobile &&
                <div
                    className={cx(s.landScapeChat, {
                        [s.landScapeVisible]: isMobile
                    })}
                >
                    <img
                        className={cx(s.toPortrait, s.centered)}
                        src={toPortraitIcon}
                        alt="Пожалуйста переключитесь в портретный режим"
                    />
                </div>}
            </Fragment>
        );
    }
}

export default withStyles(s)(Chat);
