import { Directive, ElementRef, AfterViewInit, DoCheck, inject } from '@angular/core';
import { AnimationService } from '../../core/services/animation.service';

@Directive({
  selector: '[appStaggerIn]',
  standalone: true,
})
export class StaggerInDirective implements AfterViewInit, DoCheck {
  private el = inject(ElementRef<HTMLElement>);
  private anim = inject(AnimationService);
  private lastCount = -1;

  ngAfterViewInit() {
    this.runIfChanged();
  }

  ngDoCheck() {
    this.runIfChanged();
  }

  private runIfChanged() {
    const children = Array.from(this.el.nativeElement.children);
    const count = children.length;
    if (count > 0 && count !== this.lastCount) {
      this.lastCount = count;
      this.anim.staggerIn(children as Element[]);
    }
  }
}
