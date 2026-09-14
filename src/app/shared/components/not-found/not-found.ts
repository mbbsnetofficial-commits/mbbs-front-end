import { CommonModule, Location } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('particleCanvas', { static: false })
  canvasRef?: ElementRef<HTMLCanvasElement>;

  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  private animationFrameId: number | null = null;
  private resizeListener?: () => void;
  private particles: Particle[] = [];
  private ctx: CanvasRenderingContext2D | null = null;

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    if (!prefersReducedMotion && this.canvasRef) {
      this.ngZone.runOutsideAngular(() => {
        this.initCanvas();
      });
    }
  }

  ngOnDestroy(): void {
    this.stopAnimation();
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  private initCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.updateCanvasDimensions(canvas);

    this.resizeListener = () => {
      this.updateCanvasDimensions(canvas);
      this.createParticles(canvas);
    };
    window.addEventListener('resize', this.resizeListener, { passive: true });

    this.createParticles(canvas);
    this.animate(canvas);
  }

  private updateCanvasDimensions(canvas: HTMLCanvasElement): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  private createParticles(canvas: HTMLCanvasElement): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const count = Math.floor(Math.min(Math.max((width * height) / 28000, 24), 50));

    const colors = [
      'rgba(56, 189, 248, ',
      'rgba(45, 212, 191, ',
      'rgba(199, 255, 26, ',
      'rgba(148, 163, 184, ',
    ];

    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.5 + 1.2,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        alpha: Math.random() * 0.4 + 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  private animate(canvas: HTMLCanvasElement): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = () => {
      if (!this.ctx) return;

      this.ctx.clearRect(0, 0, width, height);

      const particleCount = this.particles.length;
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const p1 = this.particles[i];
          const p2 = this.particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.12;
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
            this.ctx.lineWidth = 0.8;
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
          }
        }
      }

      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `${p.color}${p.alpha})`;
        this.ctx.fill();
      }

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = undefined;
    }
  }
}
