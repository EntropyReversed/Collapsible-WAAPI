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
    this.duration = +this.node?.dataset?.duration || 400;
    this.initiallyOpen = this.node.dataset.hasOwnProperty('initiallyOpen');
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
    this.parentAccordions = [];

    this.close = this.close.bind(this);
    this.node.toggleSelf = this.close;

    this.setFrames = this.setFrames.bind(this);
    this.node.resetFrames = this.setFrames;

    this.closeOnOutsideClick = this.node.dataset.hasOwnProperty(
      'closeOnOutsideClick'
    );
    this.classes = {
      active: 'active',
      transition: 'transition',
      in: 'transition-in',
      out: 'transition-out',
    };
    this.init();

    if (this.isInAccordion) {
      this.populateParentAccordions();
    }
  }

  populateParentAccordions() {
    if (this.accordion.closest('.collapsible')) {
      let startingParent = this.accordion.closest('.collapsible');
      let currentParent = startingParent;
      this.parentAccordions.push(startingParent);

      let searching = true;
      while (searching) {
        currentParent = currentParent.parentElement.closest('.collapsible');

        if (!currentParent) {
          searching = false;
          break;
        }

        this.parentAccordions.push(currentParent);
      }
    }
  }

  setFrames() {
    const keyframes = [
      { height: '0' },
      { height: `${this.inner.scrollHeight}px` },
    ];
    return keyframes;
  }

  toggle() {

    this.node.classList.remove(this.classes.active);
    this.node.classList.remove(this.classes.in);
    this.node.classList.remove(this.classes.out);
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
      this.node.classList.remove(this.classes.active);
      this.node.classList.remove(this.classes.out);
      this.node.classList.add(this.classes.in);
      this.node.classList.add(this.classes.transition);
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
        sibling.toggleSelf();
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
    if (
      this.isInAccordion ||
      this.supportsHover() ||
      this.triggerOn === 'click'
    ) {
      this.trigger.addEventListener('click', this.onClick.bind(this));
      return;
    }

    this.trigger.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.node.addEventListener('mouseleave', this.toggle.bind(this));
  }

  onFinish(event, reverse = true) {
    this.node.classList.remove(this.classes.transition);
    this.node.classList.remove(this.classes.in);
    this.node.classList.remove(this.classes.out);
    let sign = reverse ? 1 : -1;
    if (event.target.playbackRate * sign > 0) {
      this.node.classList['remove'](this.classes.active);
      this.node.setAttribute('aria-expanded', false);
    } else {
      this.node.classList['add'](this.classes.active);
      this.node.setAttribute('aria-expanded', true);
    }
  }

  init() {
    this.anim.playbackRate *= -1;
    this.anim.pause();
    this.initEvents();

    if (this.initiallyOpen) {
      this.node.classList.add(this.classes.active);
      this.node.setAttribute('aria-expanded', true);
    }

    this.anim.addEventListener('finish', (event) => {
      if (this.initiallyOpen) {
        this.onFinish(event);
      } else {
        this.onFinish(event, false);
      }
    });

    if (this.isInAccordion) {
      this.siblings.push(...tr_siblings(this.node));
    }
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
      console.log(e.composedPath());
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
