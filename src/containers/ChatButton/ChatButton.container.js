import { connect } from 'react-redux';
import { toggleChatAndScroll } from '../../actions/chat';
import ChatButton from '../../components/ChatButton/ChatButton';


function mapStateToProps (state) {
    const { chat: { opened: isOn, showChatButton: isVisible } = {} } = state;
    return { isOn, isVisible };
}

function mapDispatchToProps (dispatch) {
    return {
        onActivate () {
            dispatch(toggleChatAndScroll());
        }
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatButton);
