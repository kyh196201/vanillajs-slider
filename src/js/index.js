import css from '../scss/styles.scss';

import { $ } from './utils';

import Slider from './slider';

window.addEventListener('DOMContentLoaded', (e) => {
  const sliderConfig = {
    target: $('.slider'),
    sliderInner: $('.slider-inner'),
    dotsWrapper: $('.dots-wrapper'),
    arrowLeft: $('.arrow-left'),
    arrowRight: $('.arrow-right'),
    afterChangeSlide: function () {
      console.log('binding test');
    },
  };

  const slider = new Slider(sliderConfig);
  window.slider = slider;
});
