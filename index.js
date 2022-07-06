// Import stylesheets
import './style.scss';

const tr_siblings = (el) => {
  return Array.prototype.filter.call(el.parentNode.children, function (child) {
    return child !== el;
  });
};

class Collapsible {
  constructor(props) {
    this.node = props.node;
    this.trigger = this.node.querySelector('.collapsible__trigger');
    this.menu = this.node.querySelector('.collapsible__content');
    this.inner = this.node.querySelector('.collapsible__inner');
    this.easing = this.node?.dataset?.easing || 'ease-in-out';
    this.duration = +this.node?.dataset?.duration || 300;
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

    this.isInAccordion =
      this.node.parentElement.classList.contains('accordion');
    this.accordion = this.isInAccordion ? this.node.parentElement : null;
    this.siblings = [];

    this.node.closeSelf = this.close.bind(this);

    this.classes = {
      active: 'active',
      transition: 'transition',
      in: 'transition-in',
      out: 'transition-out',
      optionPicked: 'picked',
    };
    this.init();
  }

  setFrames() {
    const keyframes = [
      { height: '0' },
      { height: `${this.inner.scrollHeight}px` },
    ];
    return keyframes;
  }

  toggle() {
    this.anim.effect.setKeyframes(this.setFrames());
    this.node.classList.remove(
      this.classes.active,
      this.classes.in,
      this.classes.out
    );
    this.node.classList.add(this.classes.transition);
    if (this.anim.playbackRate === 1) {
      this.node.classList.add(
        this.initiallyOpen ? this.classes.out : this.classes.in
      );
    } else {
      this.node.classList.add(
        this.initiallyOpen ? this.classes.in : this.classes.out
      );
    }

    this.anim.updatePlaybackRate((this.anim.playbackRate *= -1));
    this.anim.play();
  }

  onMouseEnter() {
    if (this.anim.playbackRate != 1) {
      this.toggle();
      this.handleAccordion();
    }
  }

  close() {
    this.node.classList.remove(this.classes.in);
    if (
      this.node.classList.contains(this.classes.active) ||
      this.node.classList.contains(this.classes.out)
    ) {
      this.node.classList.remove(this.classes.active, this.classes.out);
      this.node.classList.add(this.classes.transition, this.classes.in);
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

  onClick() {
    this.toggle();
    this.handleAccordion();
  }

  supportsHover() {
    return window.matchMedia('(hover: none)').matches;
  }

  initEvents() {
    this.anim.addEventListener('finish', (event) => {
      if (this.initiallyOpen) {
        this.onFinish(event);
      } else {
        this.onFinish(event, false);
      }
    });

    if (this.isSelect) {
      const options = this.node.querySelectorAll('.collapsible__option');
      const triggerSpan = this.trigger.querySelector('span');
      options.forEach((option) => {
        if (option.classList.contains(this.classes.optionPicked)) {
          triggerSpan.innerText = option.innerText;
        }

        option.addEventListener('click', (e) => {
          triggerSpan.innerText = option.innerText;
          options.forEach((otherOption) => {
            otherOption.classList.remove(this.classes.optionPicked);
          });
          option.classList.add(this.classes.optionPicked);
          this.close();
        });
      });
    }

    if (
      this.isInAccordion ||
      this.supportsHover() ||
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

  onFinish(event, reverse = true) {
    this.node.classList.remove(
      this.classes.transition,
      this.classes.in,
      this.classes.out
    );

    if (event.target.playbackRate * (reverse ? 1 : -1) > 0) {
      this.node.classList.remove(this.classes.active);
      this.node.setAttribute('aria-expanded', false);
      this.menu.style.height = '0px';
    } else {
      this.node.classList.add(this.classes.active);
      this.node.setAttribute('aria-expanded', true);
      this.menu.style.height = 'auto';
    }
    this.anim.cancel();
  }

  init() {
    this.anim.playbackRate *= -1;
    this.anim.cancel();

    this.initEvents();

    if (this.initiallyOpen) {
      this.node.classList.add(this.classes.active);
      this.node.setAttribute('aria-expanded', true);
      this.menu.style.height = 'auto';
    } else {
      this.menu.style.height = '0px';
    }

    if (this.isInAccordion) {
      this.siblings.push(...tr_siblings(this.node));
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
