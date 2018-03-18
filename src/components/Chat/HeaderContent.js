import React, { Fragment, PureComponent } from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import cx from 'classnames';
import { noop } from 'lodash';
import s from './Chat.component.css';
import { Icon } from '../../components/Icons';
import Avatar from '../../components/ChatList/Avatar.component';


class HeaderContent extends PureComponent {
    static propTypes = {
        searchMode: PropTypes.bool,
        searchInput: PropTypes.string,
        name: PropTypes.string,
        color: PropTypes.string,
        param: PropTypes.string,
        type: PropTypes.string,
        onClose: PropTypes.func,
        updateState: PropTypes.func,
        onArrowClick: PropTypes.func,
        currentChat: PropTypes.bool
    };

    static defaultProps = {
        updateState: noop,
        onClose: noop,
        onArrowClick: noop,
        currentChat: false,
        searchMode: false,
        param: '',
        type: '',
        color: '',
        name: '',
        searchInput: ''
    };

    openSearch = () => {
        this.props.updateState({ searchMode: true });
        setTimeout(() => {
            this.searchInput.focus();
        });
    };

    closeSearch = () => {
        this.props.updateState({ searchMode: false, searchInput: '' });
    };


    handleSearchChange = (e) => {
        this.props.updateState({ searchInput: e.target.value });
    };

    renderForChatPanel = () => {
        const {
            onArrowClick, name, color, type, param
        } = this.props;

        return (
            <Fragment>
                <Icon
                    onClick={onArrowClick}
                    size={17}
                    color="gray9"
                    icon="arrowLeft"
                    className={cx(s.onActive, s.centered)}
                />
                <Avatar
                    type={type}
                    param={param}
                    size={34}
                    color={color}
                    className={cx(s.headerAvatar, s.centered)}
                />
                <div className={cx(s.headerText, s.specificChat, s.centered)}>{name}</div>
            </Fragment>
        );
    };

    renderForChatList = () => {
        const { searchMode, searchInput } = this.props;
        return (
            <Fragment>
                <Icon
                    onClick={this.closeSearch}
                    size={17}
                    color="gray9"
                    icon="arrowLeft"
                    className={cx(s.onActive, s.centered, { hidden: !searchMode })}
                />
                <input
                    ref={(c) => {
                        this.searchInput = c;
                    }}
                    className={cx(s.searchInput, s.centered, {
                        hidden: !searchMode
                    })}
                    type="text"
                    placeholder="Поиск"
                    onChange={this.handleSearchChange}
                    value={searchInput}
                />

                <div
                    className={cx(
                        s.indicator,
                        s.indicator_active,
                        s.centered, { hidden: searchMode }
                    )}
                />
                <div
                    className={cx(
                        s.headerText,
                        s.allChats,
                        s.centered,
                        { hidden: searchMode }
                    )}
                >Друзья
                </div>
                <Icon
                    onClick={this.openSearch}
                    size={16}
                    color="gray9"
                    icon="search"
                    className={cx(s.onActive, s.search, s.centered, {
                        hidden: searchMode
                    })}
                />
            </Fragment>
        );
    };


    render () {
        const { currentChat, onClose } = this.props;
        const render = currentChat ? this.renderForChatPanel : this.renderForChatList;
        return (
            <Fragment>
                {render()}
                <Icon
                    onClick={onClose}
                    size={17}
                    color="gray9"
                    icon="close"
                    className={cx(s.closeBtnWrapper, s.centered, s.onActive)}
                />
            </Fragment>
        );
    }
}


export default withStyles(s)(HeaderContent);
