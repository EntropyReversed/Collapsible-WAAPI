// Import stylesheets
import './style.scss';

class Collapsible {
  static classes = {
    active: 'active',
    transition: 'transition',
    in: 'transition-in',
    out: 'transition-out',
    optionPicked: 'picked',
  };

  static getSiblings(el) {
    return Array.prototype.filter.call(
      el.parentNode.children,
      function (child) {
        return child !== el;
      }
    );
  }

  static setStyles(el, styleObj) {
    Object.entries(styleObj).forEach(([key, value]) => {
      el.style[key] = value;
    });
  }

  static parseFrames(frames) {
    return JSON.parse(frames).filter((el) => {
      return el;
    });
  }

  static supportsHover() {
    return window.matchMedia('(hover: none)').matches;
  }

  static triggerCallback(pointer, condition, fnArr) {
    if (condition) {
      fnArr.forEach((fn) => {
        fn.call(pointer);
      });
    }
  }

  constructor(props) {
    this.node = props.node;
    this.trigger = this.node.querySelector('.collapsible__trigger');
    this.menu = this.node.querySelector('.collapsible__content');
    this.inner = this.node.querySelector('.collapsible__inner');

    this.isInAccordion =
      this.node.parentElement.classList.contains('accordion');
    this.accordion = this.isInAccordion ? this.node.parentElement : null;
    this.siblings = [];

    this.easing =
      this.accordion?.dataset?.easing ||
      this.node?.dataset?.easing ||
      'ease-in-out';

    this.duration =
      +this.accordion?.dataset?.duration ||
      +this.node?.dataset?.duration ||
      300;

    this.initiallyOpen = this.node.dataset.hasOwnProperty('initiallyOpen');
    this.closeOnOutsideClick = this.node.dataset.hasOwnProperty(
      'closeOnOutsideClick'
    );
    this.isSelect = this.node.dataset.hasOwnProperty('select');

    this.anim = this.menu.animate(this.setFrames(), {
      easing: this.easing,
      duration: this.duration,
      fill: 'both',
      direction: this.initiallyOpen ? 'reverse' : 'normal',
    });

    this.triggerOn = this.node?.dataset?.triggerOn || 'click';

    this.node.closeSelf = this.close.bind(this);

    this.hasCustomKeyframes = this.node.dataset.hasOwnProperty('keyframes');
    if (!this.isInAccordion && this.hasCustomKeyframes) {
      this.passedFrames = this.constructor.parseFrames(
        this.node.dataset.keyframes
      );
    }
    this.init();
  }

  setFrames() {
    return this.hasCustomKeyframes
      ? this.passedFrames
      : [{ height: '0' }, { height: `${this.inner.scrollHeight}px` }];
  }

  toggle() {
    this.anim.effect.setKeyframes(this.setFrames());
    this.node.classList.remove(
      this.constructor.classes.active,
      this.constructor.classes.in,
      this.constructor.classes.out
    );
    this.node.classList.add(this.constructor.classes.transition);
    if (this.anim.playbackRate === 1) {
      this.node.classList.add(
        this.initiallyOpen
          ? this.constructor.classes.out
          : this.constructor.classes.in
      );
    } else {
      this.node.classList.add(
        this.initiallyOpen
          ? this.constructor.classes.in
          : this.constructor.classes.out
      );
    }

    this.anim.updatePlaybackRate((this.anim.playbackRate *= -1));
    this.anim.play();
  }

  onMouseEnter() {
    this.constructor.triggerCallback(this, this.anim.playbackRate != 1, [
      this.toggle,
      this.handleAccordion,
    ]);
  }

  onClick() {
    this.constructor.triggerCallback(this, true, [
      this.toggle,
      this.handleAccordion,
    ]);
  }

  close() {
    this.anim.effect.setKeyframes(this.setFrames());
    this.node.classList.remove(this.constructor.classes.in);
    if (
      this.node.classList.contains(this.constructor.classes.active) ||
      this.node.classList.contains(this.constructor.classes.out)
    ) {
      this.node.classList.remove(
        this.constructor.classes.active,
        this.constructor.classes.out
      );
      this.node.classList.add(
        this.constructor.classes.transition,
        this.constructor.classes.in
      );
      this.anim.playbackRate *= -1;
      this.anim.play();
    }
  }

  handleAccordion() {
    if (
      this.isInAccordion &&
      this.accordion.dataset.hasOwnProperty('collapseSiblings')
    ) {
      this.siblings.forEach((sibling) => {
        sibling.closeSelf();
      });
    }
  }

  initEvents() {
    this.anim.addEventListener('finish', (event) => {
      if (this.initiallyOpen) {
        this.onFinish(event);
      } else {
        this.onFinish(event, false);
      }
    });

    if (
      this.isInAccordion ||
      this.constructor.supportsHover() ||
      this.triggerOn === 'click'
    ) {
      this.trigger.addEventListener('click', this.onClick.bind(this));
      return;
    }

    this.trigger.addEventListener('mouseover', this.onMouseEnter.bind(this));
    this.node.addEventListener('mouseleave', (e) => {
      // TODO: find a way to always detect mouseleave;
      this.toggle();
    });
  }

  selectCollapsible() {
    const options = this.node.querySelectorAll('.collapsible__option');
    const triggerSpan = this.trigger.querySelector(
      '.collapsible__select-current'
    );
    options.forEach((option) => {
      const optionHasDataVal = option.dataset.hasOwnProperty('value');
      if (option.classList.contains(this.constructor.classes.optionPicked)) {
        triggerSpan.innerText = option.innerText;
        if (optionHasDataVal) {
          this.node.setAttribute('data-value', option.dataset.value);
        }
      }

      option.addEventListener('click', (e) => {
        this.constructor.getSiblings(option).forEach((sibling) => {
          sibling.classList.remove(this.constructor.classes.optionPicked);
        });
        option.classList.add(this.constructor.classes.optionPicked);
        if (optionHasDataVal) {
          this.node.setAttribute('data-value', option.dataset.value);
        }
        this.close();
      });
    });
  }

  setStartState() {
    if (!this.hasCustomKeyframes) {
      this.constructor.setStyles(this.menu, { height: '0px' });
    } else {
      this.constructor.setStyles(this.menu, this.passedFrames[0]);
    }
  }

  setEndState() {
    if (!this.hasCustomKeyframes) {
      this.constructor.setStyles(this.menu, { height: 'auto' });
    } else {
      this.constructor.setStyles(
        this.menu,
        this.passedFrames[this.passedFrames.length - 1]
      );
    }
  }

  onFinish(event, reverse = true) {
    this.node.classList.remove(
      this.constructor.classes.transition,
      this.constructor.classes.in,
      this.constructor.classes.out
    );

    if (event.target.playbackRate * (reverse ? 1 : -1) > 0) {
      this.node.classList.remove(this.constructor.classes.active);
      this.node.setAttribute('aria-expanded', false);
      this.setStartState();
    } else {
      this.node.classList.add(this.constructor.classes.active);
      this.node.setAttribute('aria-expanded', true);
      this.setEndState();
    }
    this.anim.cancel();
  }

  init() {
    this.anim.playbackRate *= -1;
    this.anim.cancel();

    this.initEvents();

    if (this.initiallyOpen) {
      this.node.classList.add(this.constructor.classes.active);
      this.node.setAttribute('aria-expanded', true);
      this.setEndState();
    } else {
      this.setStartState();
    }

    if (this.isInAccordion) {
      this.siblings.push(...this.constructor.getSiblings(this.node));
    }

    if (this.isSelect) {
      this.selectCollapsible();
    }

    this.node.style.setProperty('--duration', `${this.duration / 1000}s`);
  }
}

class Collapsibles {
  constructor() {
    if (!document.querySelector('.collapsible')) return;
    this.nodes = document.querySelectorAll('.collapsible');
    this.collapsibles = [];
    this.init();
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.collapsibles.forEach((col) => {
        col.anim.effect.setKeyframes(col.setFrames());
      });
    });

    document.addEventListener('click', (e) => {
      this.collapsibles.forEach((col) => {
        if (
          !col.isInAccordion &&
          col.closeOnOutsideClick &&
          !e.composedPath().includes(col.node) &&
          col.anim.playbackRate > 0
        ) {
          col.toggle();
        }
      });
    });
  }

  init() {
    this.nodes.forEach((node) => {
      this.collapsibles.push(new Collapsible({ node }));
    });
    this.initEvents();
  }
}

new Collapsibles();
