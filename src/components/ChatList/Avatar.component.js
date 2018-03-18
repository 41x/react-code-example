import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './Avatar.component.css';
import { generateColor } from '../../actions/chat';


class Avatar extends Component {
    static propTypes = {
        type: PropTypes.string,
        param: PropTypes.string,
        color: PropTypes.string,
        size: PropTypes.number,
        indicator: PropTypes.bool,
        className: PropTypes.string,
    };

    static defaultProps = {
        type: '',
        param: '',
        className: '',
        size: 40,
        color: '',
        indicator: false,
    };

    constructor (props) {
        super(props);
        this.state = {
            height: 0,
            width: 0
        };
    }

    setDimensions = ({ target: img }) => {
        this.setState({
            height: img.height,
            width: img.width
        });
    };


    render () {
        const {
            type, param, className,
            size, color, indicator
        } = this.props;

        let view;
        const style = { width: size, height: size };

        if (type === 'url') {
            let imgStyle = {};
            const { width, height } = this.state;
            if (width && height) {
                imgStyle = width > height
                    ? { height: '100%', width: 'auto' }
                    : { width: '100%', height: 'auto' };
            }

            view = <img style={imgStyle} onLoad={this.setDimensions} src={param} alt="Аватар" />;
        } else if (type === 'name') {
            view = <div className={s.textAvatar}><span>{param}</span></div>;
            style.backgroundColor = color || generateColor();
            style.lineHeight = `${size}px`;
        }

        return (
            <div className={cx(s.root, className)}>
                <div
                    style={style}
                    className={s.avatar}
                >{view}
                </div>
                {!!indicator && <div className={s.indicator} />}
            </div>
        );
    }
}

export default withStyles(s)(Avatar);
