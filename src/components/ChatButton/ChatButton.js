import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import cx from 'classnames';
import { noop } from 'lodash';
import s from './ChatButton.css';
import messageIcon from './message.svg';
import { Icon } from '../../components/Icons';


class ChatButton extends React.PureComponent {
    static propTypes = {
        isOn: PropTypes.bool,
        isVisible: PropTypes.bool,
        onActivate: PropTypes.func,
    };

    static defaultProps = {
        isOn: false,
        isVisible: false,
        onActivate: noop,
    };

    render () {
        return (
            <button
                className={cx(
                    'unstyled-button',
                    s.generalChatButton,
                    { [s.chatIsOpened]: this.props.isOn },
                    { hidden: !this.props.isVisible }
                )}
                onClick={this.props.onActivate}
            >
                <img className={s.msgIcon} src={messageIcon} alt="Отправить сообщение" />
                <Icon
                    className={s.closeIcon}
                    size={20}
                    color="white"
                    icon="close"
                />
            </button>
        );
    }
}

export default withStyles(s)(ChatButton);
