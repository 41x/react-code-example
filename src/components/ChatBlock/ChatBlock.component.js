import React, { Fragment } from 'react';
import Chat from '../../containers/Chat/Chat.container';
import ChatButton from '../../containers/ChatButton/ChatButton.container';


const ChatBlock = () => {
    return (
        <Fragment>
            <Chat />
            <ChatButton />
        </Fragment>
    );
};

export default ChatBlock;
