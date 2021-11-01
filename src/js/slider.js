import {
  $,
  debounce,
  addListeners,
  removeListners,
  getTranslate,
  addClass,
  removeClass,
} from './utils';

class Slider {
  constructor(config) {
    this.def = {
      transition: {
        speed: 300,
        easing: 'ease-out',
      },
      swipe: true,
      autoHeight: true,
      // threshold: '25%',
      threshold: 40,

      DIRS: {
        LEFT: 'left',
        RIGHT: 'right',
      },

      lazyLoad: false,
    };

    this.setup(config);
    this.init();
    this.bindResizeEvent();
  }

  setup(config) {
    this.def = {
      ...this.def,
      ...config,
    };

    this.target = this.def.target;
    this.sliderInner = this.def.sliderInner;
    this.dotsWrapper = this.def.dotsWrapper;
    this.arrowLeft = this.def.arrowLeft;
    this.arrowRight = this.def.arrowRight;

    this.afterChangeSlide =
      typeof this.def.afterChangeSlide === 'function'
        ? this.def.afterChangeSlide
        : function () {
            console.log('afterChangeSlide');
          };
  }

  init() {
    const self = this;

    self.threshold = 0;

    // clone 슬라이드를 포함한 모든 slide 엘리먼트
    self.allSlides = 0;
    self.curSlide = 0;

    // Position
    self.curTranslate = 0;
    self.startX = null;
    self.startY = null;
    self.moveX = null;
    self.moveY = null;

    self.slideWidth = 0;

    self.dir = '';

    self.totalSlides = self.target.querySelectorAll('.slide').length;
    self.loadedCnt = 0;
    self.isAnimating = false;

    self.buildDots();
    self.createClones();
    self.updateSliderDimension();
    self.updateDots();
    self.setupNavigation();

    if (self.def.swipe) {
      addListeners(self.sliderInner, 'mousedown touchstart', startSwipe);
    }

    if (self.def.lazyLoad) {
      self.allSlides.forEach((el) => {
        self.loadlazyImage(el);
      });
    }

    // Event Handlers
    /**
     * mousedown, touchstart 이벤트 핸들러
     */
    function startSwipe(event) {
      self.getCurTranslate();

      let touch = event;

      if (self.isAnimating) return false;

      if (event.type === 'touchstart') {
        touch = event.targetTouches[0] || event.changedTouches[0];
      }

      self.startX = touch.pageX;
      self.startY = touch.pageY;

      addListeners(self.sliderInner, 'mousemove touchmove', swipeMove);
      addListeners($('body'), 'mouseup touchend', swipeEnd);
    }

    /**
     * mousemove, touchmove 이벤트 핸들러
     */
    function swipeMove(event) {
      let touch = event;

      if (event.type === 'touchmove') {
        touch = event.targetTouches[0] || event.changedTouches[0];
      }

      self.moveX = touch.pageX;
      self.moveY = touch.pageY;

      if (Math.abs(self.moveX - self.startX) < 40) {
        return;
      }

      self.isAnimating = true;

      addClass(self.target, 'isAnimating');

      event.preventDefault();

      // 이동 거리
      const moveDistance = self.moveX - self.startX;

      // 복사된 첫번째 슬라이드에서 이전 슬라이드로 이동하는 경우
      if (self.curTranslate + moveDistance > 0 && self.curTranslate === 0) {
        self.curTranslate = -(self.totalSlides * self.slideWidth);
      } else if (
        self.curTranslate + moveDistance <
        -1 * (self.totalSlides + 1) * self.slideWidth
      ) {
        // 복사된 마지막 슬라이드에서 다음 슬라이드로 이동하는 경우
        self.curTranslate = -self.slideWidth;
      }

      const translateValue = self.curTranslate + moveDistance;

      self.setTranslate(translateValue);
    }

    /**
     * mouseup, touchend 이벤트 핸들러
     */
    function swipeEnd(event) {
      self.getCurTranslate();

      const moveDistance = self.moveX - self.startX;

      if (Math.abs(moveDistance) === 0) return false;

      // 현재 위치에 고정할지 말지
      const stayAtCur =
        Math.abs(moveDistance) < self.threshold || self.moveX === null
          ? true
          : false;

      self.dir = moveDistance < 0 ? self.def.DIRS.RIGHT : self.def.DIRS.LEFT;

      // 움직여야되면
      if (!stayAtCur) {
        if (self.dir === self.def.DIRS.LEFT) {
          self.curSlide -= 1;
        } else {
          self.curSlide += 1;
        }

        // clone 슬라이드로 이동해야되는 순서에 실제 슬라이드 인덱스로 이동한다.
        if (self.curSlide < 0) {
          self.curSlide = self.totalSlides - 1;
        } else if (self.curSlide === self.totalSlides + 2) {
          self.curSlide = 2;
        }
      }

      self.updateDots();
      self.gotoSlide();

      self.startX = null;
      self.startY = null;
      self.moveX = null;
      self.moveY = null;

      self.isAnimating = false;

      removeClass(self.target, 'isAnimating');

      removeListners(self.sliderInner, 'mousemove touchmove', swipeMove);
      removeListners($('body'), 'mouseup touchend', swipeEnd);
    }
  }

  bindResizeEvent() {
    const self = this;

    window.addEventListener(
      'resize',
      debounce(function (event) {
        self.updateSliderDimension(event);
      })
    );
  }

  bindEvents() {}
}

Slider.prototype.setupNavigation = function() {
  const self = this;

  addListeners(self.arrowLeft, 'click', function() {
    if(self.isAnimating) return false;

    self.curSlide -= 1;

    if(self.curSlide < 0) {
      const translateValue = -(self.totalSlides * self.slideWidth);
      self.setTranslate(translateValue);

      self.curSlide = self.totalSlides - 1;
    }

    self.updateDots();

    setTimeout(function() {
      self.gotoSlide();
    }, 0)
  });

  addListeners(self.arrowRight, 'click', function() {
    if(self.isAnimating) return false;

    self.curSlide += 1;

    if( self.curSlide > self.totalSlides + 1) {
      const translateValue = -(self.slideWidth);
      self.setTranslate(translateValue);

      self.curSlide = 2;
    }

    self.updateDots();

    // FIXME setTimeout하지 않을 경우 translate가 변하기 전에 gotoSLide 함수가 실행됨
    setTimeout(function() {
      self.gotoSlide();
    }, 0)
  });
}

// 슬라이드 이동
Slider.prototype.gotoSlide = function () {
  const self = this;

  self.sliderInner.style.transition = `transform ${
    self.def.transition.speed / 1000
  }s ${self.def.transition.easing}`;

  const translateValue = -(self.curSlide * self.slideWidth);

  self.setTranslate(translateValue);

  addClass(self.target, 'isAnimating');

  setTimeout(function () {
    self.sliderInner.style.transition = '';
    removeClass(self.target, 'isAnimating');
  }, self.def.transition.speed);
};

/**
 * loop를 위해서 처음/마지막 슬라이드 복사본 생성
 */
Slider.prototype.createClones = function () {
  const self = this;

  const $slides = self.target.querySelectorAll('.slide');

  if (!$slides.length) {
    throw new Error('no slides');
  }

  const cloneFirst = $slides[0].cloneNode(true);

  cloneFirst.classList.add('slide-clone');

  self.sliderInner.appendChild(cloneFirst);

  const cloneLast = $slides[$slides.length - 1].cloneNode(true);

  cloneLast.classList.add('slide-clone');

  self.sliderInner.insertBefore(cloneLast, self.sliderInner.firstChild);

  self.curSlide += 1;
  self.allSlides = self.target.querySelectorAll('.slide');
};

Slider.prototype.updateDots = function() {
  const self = this;

  if(!self.totalSlides) return false;

  const $dots = self.dotsWrapper.querySelectorAll('.dot');

  Array.prototype.forEach.call($dots, function(dot) {
    dot.classList.remove('active');
  });

  let activeIndex = self.curSlide - 1;

  if(self.curSlide === 0) {
    activeIndex = self.totalSlides - 1;
  } else if (self.curSlide > self.totalSlides) {
    activeIndex = 0;
  }

  $dots[activeIndex].classList.add('active');
};

// Dots 생성
Slider.prototype.buildDots = function () {
  const self = this;

  for (let i = 0; i < self.totalSlides; i++) {
    const $dot = document.createElement('li');
    $dot.className = 'dot';
    $dot.setAttribute('data-slide', i + 1);
    self.dotsWrapper.appendChild($dot);
  }

  self.dotsWrapper.addEventListener(
    'click',
    function (e) {
      if(self.isAnimating) return false;

      const $target = e.target;

      if ($target && $target.nodeName !== 'LI') return false;

      if(self.curSlide === self.totalSlides + 1) {
        const translateValue = -(self.slideWidth);

        self.setTranslate(translateValue);
      } else if(self.curSlide === 0) {
        const translateValue = -(self.totalSlides * self.slideWidth);

        self.setTranslate(translateValue);
      }
      
      self.curSlide = Number($target.getAttribute('data-slide'));

      self.updateDots();

      setTimeout(function() {
        self.gotoSlide();
      }, 0)
    },
    false
  );
};

Slider.prototype.updateSliderDimension = function (event) {
  const self = this;

  self.getSlideWidth();
  self.getThreshold();

  const translateValue = -(self.slideWidth * self.curSlide);

  self.setTranslate(translateValue);
};

// 이미지 레이지 로드
Slider.prototype.loadlazyImage = function (el) {
  const self = this;
  let loaded = false;

  const loadHandler = function () {
    if (loaded) return false;

    loaded = true;

    self.loadedCnt += 1;

    if (self.loadedCnt >= self.totalSlides + 2) {
      self.updateSliderDimension();
    }
  };

  const $img = el.querySelector('img');

  if ($img) {
    $img.onload = loadHandler;
    $img.src = $img.getAttribute('data-src');
    $img.classList.remove('lazy');

    if ($img.complete) {
      loadHandler();
    }
  }
};

/**
 * 현재 transform translate 값 설정하기
 * @param {string} axis : 슬라이드 방향
 * @returns {number}
 */
Slider.prototype.getCurTranslate = function (axis = 'x') {
  this.curTranslate = getTranslate(this.sliderInner, axis);

  return this.curTranslate;
};

/**
 * Slider Inner translate값 변경
 * @param {string} value
 */
Slider.prototype.setTranslate = function (value = 0, axis = 'x') {
  const self = this;

  if (axis === 'x') {
    self.sliderInner.style.transform = `translate3d(${value}px, 0, 0)`;
  } else {
    self.sliderInner.style.transform = `translate3d(0, ${value}px, 0)`;
  }

  return true;
};

/**
 * 현재 슬라이드 너비 구하기
 * @returns {number}
 */
Slider.prototype.getSlideWidth = function () {
  const self = this;

  if (!self.totalSlides) return 0;

  const $slide = self.allSlides[0];

  this.slideWidth = $slide.getBoundingClientRect().width;

  return this.slideWidth;
};

Slider.prototype.getThreshold = function () {
  const self = this;
  const { threshold } = self.def;

  let result = 0;

  if (typeof threshold === 'string' && threshold.indexOf('%') > -1) {
    const replacedThreshold = Number(threshold.replace('%', ''));

    result = (self.slideWidth * replacedThreshold) / 100;
  } else {
    result = threshold;
  }

  self.threshold = result;
};

export default Slider;
