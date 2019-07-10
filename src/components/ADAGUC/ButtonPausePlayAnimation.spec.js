import React from 'react';
import ButtonPausePlayAnimation from './ButtonPausePlayAnimation';
import { shallow } from 'enzyme';
import { Button } from 'reactstrap';

describe('(Component) ButtonPausePlayAnimation', () => {
  it('Renders a Button', () => {
    const _component = shallow(<ButtonPausePlayAnimation />);
    expect(_component.type()).to.eql(Button);
  });
});
