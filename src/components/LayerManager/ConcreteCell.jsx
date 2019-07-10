import React, { PureComponent } from 'react';
import { Badge } from 'reactstrap';
import PropTypes from 'prop-types';

export default class ConcreteCell extends PureComponent {
  render () {
    if (this.props.active) {
      return <Badge pill onClick={this.props.onClick} color={this.props.color}>{this.props.children}</Badge>;
    } else {
      return <Badge pill onClick={this.props.onClick} className={'alert-' + this.props.color}>{this.props.children}</Badge>;
    }
  }
}

ConcreteCell.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func,
  color: PropTypes.string,
  children: PropTypes.array
};
