import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import PreventParentScoll from 'prevent-parent-scroll';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { noop } from 'lodash';
import s from './ChatList.component.css';
import ChatGroup from './ChatGroup.component';


/**
 * Компонент для отобрвжения списка чатов.
 */
class ChatList extends PureComponent {
    static propTypes = {
        groups: PropTypes.arrayOf(PropTypes.shape({})),
        userId: PropTypes.string,
        className: PropTypes.string,
        onChatSelect: PropTypes.func,
    };

    static defaultProps = {
        groups: [],
        userId: '',
        className: '',
        onChatSelect: noop,
    };

    componentDidMount () {
        if (this.root) {
            this.preventParentScroll = new PreventParentScoll(this.root);
            this.preventParentScroll.start();
        }
    }

    componentWillUnmount () {
        if (this.preventParentScroll) {
            this.preventParentScroll.stop();
        }
    }

    render () {
        const {
            userId, className,
            groups, onChatSelect
        } = this.props;

        let content;
        if (groups.length) {
            content = groups.map((g) => {
                return (
                    <ChatGroup
                        key={g.name}
                        header={g.name}
                        chats={g.chats}
                        userId={userId}
                        onChatSelect={onChatSelect}
                    />
                );
            });
        }

        return (
            <div
                ref={(c) => {
                    this.root = c;
                }}
                className={cx(s.root, className)}
            >{content}
            </div>
        );
    }
}

export default withStyles(s)(ChatList);
