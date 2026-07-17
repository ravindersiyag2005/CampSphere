import { Injectable } from '@angular/core';
import anime from 'animejs';

@Injectable({ providedIn: 'root' })
export class AnimationService {
  /** Staggered fade + rise entrance for a list of elements (cards, table rows, chat bubbles…) */
  staggerIn(targets: string | Element | Element[] | NodeListOf<Element>, opts: { delay?: number; y?: number } = {}) {
    anime.set(targets, { opacity: 0, translateY: opts.y ?? 18 });
    return anime({
      targets,
      opacity: [0, 1],
      translateY: [opts.y ?? 18, 0],
      duration: 520,
      delay: anime.stagger(70, { start: opts.delay ?? 0 }),
      easing: 'easeOutCubic',
    });
  }

  /** One-shot fade + rise for a single element/section (hero, page header, card panel) */
  fadeUp(targets: string | Element | Element[], delay = 0) {
    anime.set(targets, { opacity: 0, translateY: 22 });
    return anime({
      targets,
      opacity: [0, 1],
      translateY: [22, 0],
      duration: 650,
      delay,
      easing: 'easeOutExpo',
    });
  }

  /** Scale-pop entrance, good for modules/cards that should feel "alive" */
  popIn(targets: string | Element | Element[] | NodeListOf<Element>, delay = 0) {
    anime.set(targets, { opacity: 0, scale: 0.86 });
    return anime({
      targets,
      opacity: [0, 1],
      scale: [0.86, 1],
      duration: 560,
      delay: anime.stagger(60, { start: delay }),
      easing: 'easeOutBack',
    });
  }

  /** Count a number up from 0 (or from a start value) to a target, writing into el.textContent */
  countUp(el: Element | null, to: number, opts: { duration?: number; decimals?: number; prefix?: string; suffix?: string } = {}) {
    if (!el) return;
    const obj = { value: 0 };
    anime({
      targets: obj,
      value: to,
      duration: opts.duration ?? 1100,
      easing: 'easeOutCubic',
      round: opts.decimals ? undefined : 1,
      update: () => {
        const v = opts.decimals ? obj.value.toFixed(opts.decimals) : Math.round(obj.value);
        el.textContent = `${opts.prefix ?? ''}${v}${opts.suffix ?? ''}`;
      },
    });
  }

  /** Quick tactile bounce for a click (buttons, upvotes, etc.) */
  pulse(target: Element | null) {
    if (!target) return;
    anime({
      targets: target,
      scale: [1, 1.16, 1],
      duration: 340,
      easing: 'easeOutElastic(1, .6)',
    });
  }

  /** Gentle shake — used for form errors / blocked actions */
  shake(target: Element | null) {
    if (!target) return;
    anime({
      targets: target,
      translateX: [0, -8, 8, -6, 6, -2, 2, 0],
      duration: 480,
      easing: 'easeInOutSine',
    });
  }

  /** Slide + fade toast entrance */
  toastIn(target: Element | null) {
    if (!target) return;
    anime({
      targets: target,
      opacity: [0, 1],
      translateX: [40, 0],
      duration: 380,
      easing: 'easeOutCubic',
    });
  }
}
