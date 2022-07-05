// Import stylesheets
import './style.scss';

class Collapsible {
  constructor(props) {
    this.node = props.node;
    this.trigger = this.node.querySelector('.collapsible__trigger');
    this.menu = this.node.querySelector('.collapsible__content');
    this.inner = this.node.querySelector('.collapsible__inner');
    this.easing = this.node?.dataset?.easing || 'ease-in-out';
    this.duration = +this.node?.dataset?.duration || 400;
    this.initiallyOpen = this.node.dataset.hasOwnProperty('initiallyOpen');
    this.anim = this.menu.animate(this.setFrames(this.initiallyOpen), {
      easing: this.easing,
      duration: this.duration,
      fill: 'both',
    });
    this.triggerOn = this.node?.dataset?.triggerOn || 'click';

    // this.isInAccordion =
    //   this.node.parentElement.classList.contains('accordion');
    // this.accordion = this.isInAccordion ? this.node.parentElement : null;
    this.closeOnOutsideClick = true;
    this.classes = {
      active: 'active',
      transition: 'transition',
    };
    this.init();
  }

  setFrames(reverse = false) {
    return {
      height: reverse
        ? [`${this.inner.scrollHeight}px`, '0']
        : ['0', `${this.inner.scrollHeight}px`],
    };
  }

  toggle() {
    this.anim.playbackRate *= -1;
    this.anim.play();
  }

  onMouseEnter() {
    if (this.anim.playbackRate != 1) {
      this.toggle();
    }
  }

  supportsHover() {
    return window.matchMedia('(hover: none)').matches;
  }

  initEvents() {
    if (this.supportsHover() || this.triggerOn === 'click') {
      this.trigger.addEventListener('click', this.toggle.bind(this));
      return;
    }

    this.trigger.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.node.addEventListener('mouseleave', this.toggle.bind(this));
  }

  onFinish(event, reverse = true) {
    if (event.target.playbackRate > 0) {
      this.node.classList[reverse ? 'remove' : 'add'](this.classes.active);
      this.node.setAttribute('aria-expanded', reverse ? false : true);
    } else {
      this.node.classList[reverse ? 'add' : 'remove'](this.classes.active);
      this.node.setAttribute('aria-expanded', reverse ? true : false);
    }
  }

  init() {
    if (this.initiallyOpen) {
      this.node.classList.add(this.classes.active);
      this.node.setAttribute('aria-expanded', true);
    }

    this.anim.playbackRate *= -1;
    this.anim.pause();
    this.initEvents();

    this.anim.addEventListener('finish', (event) => {
      if (this.initiallyOpen) {
        this.onFinish(event);
      } else {
        this.onFinish(event, false);
      }
    });
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

    // document.addEventListener('click', (e) => {
    //   console.log(e.composedPath());
    //   this.collapsibles.forEach((col) => {
    //     if (
    //       col.closeOnOutsideClick &&
    //       !e.composedPath().includes(col.node) &&
    //       col.anim.playbackRate > 0
    //     ) {
    //       col.toggle();
    //     }
    //   });
    // });
  }

  init() {
    this.nodes.forEach((node) => {
      this.collapsibles.push(new Collapsible({ node }));
    });
    this.initEvents();
  }
}

new Collapsibles();
