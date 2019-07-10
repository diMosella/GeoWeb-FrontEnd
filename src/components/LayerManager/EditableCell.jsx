import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ConcreteCell from './ConcreteCell';
import Icon from 'react-fa';

export default class EditableCell extends PureComponent {
  render () {
    return (<ConcreteCell onClick={this.props.onClick} active={this.props.active} color={this.props.color}>
      {this.props.children}&nbsp;
      <Icon id={this.props.id} name='pencil' />
    </ConcreteCell>);
  }
}

EditableCell.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func,
  color: PropTypes.string,
  children: PropTypes.array,
  id: PropTypes.string
};
