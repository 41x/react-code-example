import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Chat from '../../components/Chat/Chat.component';
import {
    getChats,
    reset,
    clearPreviousMessages,
    getPreviousMessages,
    hideChat,
    getChatMessages,
    sendChatMessage,
    markChatAsRead,
    setActiveChat,
    resetCurrentChat,
    initializeChat,
    setTransferInitiatorIsChat,
    openChat,
    showChatBtn,
    sendMoneyRequest,
} from '../../actions/chat';


function mapStateToProps (state) {
    const {
        chat: {
            reOpen,
            chats,
            bots,
            supportChats,
            commonChats,
            opened,
            currentChatName,
            prevMsgLoading,
            messagesLoading,
            botsLoading,
            chatsLoading,
            chatIsLoading,
            sendMessageLoading,
            sendMoneyRequestLoading,
            currentChat,
            messages
        } = {},
        user: { Uid: userId } = {},
        auth: { isLoggedIn } = {}
    } = state;

    return {
        reOpen,
        supportChats,
        commonChats,
        chats,
        bots,
        opened,
        currentChatName,
        userId,
        isLoggedIn,
        prevMsgLoading,
        messagesLoading,
        sendMoneyRequestLoading,
        botsLoading,
        chatsLoading,
        chatIsLoading,
        sendMessageLoading,
        messages: currentChat && messages[currentChat.Id],
        currentChat
    };
}


function mapDispatchToProps (dispatch) {
    return {
        ...bindActionCreators({
            getChats,
            hideChat,
            reset,
            initializeChat,
            getChatMessages,
            sendChatMessage,
            markChatAsRead,
            getPreviousMessages,
            clearPreviousMessages,
            setActiveChat,
            resetCurrentChat,
            setTransferInitiatorIsChat,
            openChat,
            showChatBtn,
            sendMoneyRequest,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
