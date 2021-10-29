function $(elem) {
  return document.querySelector(elem);
}

function addClass(el, classNames) {
  if (el.classList) {
    el.classList.add(classNames);
  } else {
    el.className += ' ' + classNames;
  }

  return true;
}

function removeClass(el, classNames) {
  if (el.classList) {
    el.classList.remove(classNames);
  } else {
    el.className = el.className.replace(
      new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'),
      ' '
    );
  }

  return true;
}

function debounce(fn, delay = 100) {
  let timer = null;

  return function () {
    const context = this;
    const args = arguments;

    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}

function addListeners(el, events, fn) {
  events.split(' ').forEach((event) => {
    el.addEventListener(event, fn, false);
  });

  return true;
}

function removeListners(el, events, fn) {
  events.split(' ').forEach((event) => {
    el.removeEventListener(event, fn, false);
  });

  return true;
}

/**
 * Ref : https://github.com/nolimits4web/swiper/blob/057fa60219f4ffea66452150ae6f0c2e64340dec/src/shared/utils.js#L39
 * @param {object} el : html Element
 * @param {string} axis
 * @returns
 */
function getTranslate(el, axis = 'x') {
  let matrix;
  let curTransform;
  let transformMatrix;

  const curStyle = getComputedStyle(el, null);

  if (window.WebKitCSSMatrix) {
    curTransform = curStyle.transform || curStyle.webkitTransform;
    if (curTransform.split(',').length > 6) {
      curTransform = curTransform
        .split(', ')
        .map((a) => a.replace(',', '.'))
        .join(', ');
    }
    // Some old versions of Webkit choke when 'none' is passed; pass
    // empty string instead in this case
    transformMatrix = new window.WebKitCSSMatrix(
      curTransform === 'none' ? '' : curTransform
    );
  } else {
    transformMatrix =
      curStyle.MozTransform ||
      curStyle.OTransform ||
      curStyle.MsTransform ||
      curStyle.msTransform ||
      curStyle.transform ||
      curStyle
        .getPropertyValue('transform')
        .replace('translate(', 'matrix(1, 0, 0, 1,');
    matrix = transformMatrix.toString().split(',');
  }

  if (axis === 'x') {
    // Latest Chrome and webkits Fix
    if (window.WebKitCSSMatrix) curTransform = transformMatrix.m41;
    // Crazy IE10 Matrix
    else if (matrix.length === 16) curTransform = parseFloat(matrix[12]);
    // Normal Browsers
    else curTransform = parseFloat(matrix[4]);
  }
  if (axis === 'y') {
    // Latest Chrome and webkits Fix
    if (window.WebKitCSSMatrix) curTransform = transformMatrix.m42;
    // Crazy IE10 Matrix
    else if (matrix.length === 16) curTransform = parseFloat(matrix[13]);
    // Normal Browsers
    else curTransform = parseFloat(matrix[5]);
  }
  return curTransform || 0;
}

export {
  $,
  debounce,
  addListeners,
  removeListners,
  getTranslate,
  addClass,
  removeClass,
};
