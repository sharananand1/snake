import { Component, ElementRef, ViewChild, OnInit, HostListener } from '@angular/core';

interface Point {
  x: number;
  y: number;
}

@Component({
  selector: 'app-snake-game',
  templateUrl: './snake-game.component.html',
  styleUrls: ['./snake-game.component.css']
})
export class SnakeGameComponent implements OnInit {
  @ViewChild('gameCanvas', { static: true }) gameCanvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private snake: Point[] = [{ x: 10, y: 10 }];
  private direction: Point = { x: 1, y: 0 };
  private food: Point = { x: 10, y: 10 };
  private gridSize: number = 30;
  private intervalId!: number;
  public isPaused: boolean = false;
  public score: number = 0;
  public isGameOver: boolean = false;
  private baseSpeed: number = 300;
  private speedIncrement: number = 10;
  private eatFoodSound = new Audio('assets/eat-food.mp3'); // Load sound file

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (this.isPaused || this.isGameOver) return;

    switch (event.key) {
      case 'ArrowUp':
        if (this.direction.y === 0) this.direction = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
        if (this.direction.y === 0) this.direction = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
        if (this.direction.x === 0) this.direction = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
        if (this.direction.x === 0) this.direction = { x: 1, y: 0 };
        break;
      case 'p':
        this.togglePause();
        break;
      case 'r':
        if (this.isGameOver) this.restartGame();
        break;
    }
  }

  ngOnInit(): void {
    this.ctx = this.gameCanvas.nativeElement.getContext('2d')!;
    if (!this.ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.initializeGame();
  }

  private initializeGame(): void {
    this.isGameOver = false;
    this.isPaused = false;
    this.snake = [{ x: 10, y: 10 }];
    this.direction = { x: 1, y: 0 };
    this.food = { x: 10, y: 10 };
    this.score = 0;
    this.startGame();
  }

  private startGame(): void {
    this.intervalId = setInterval(() => this.gameLoop(), this.getSpeed());
  }

  private gameLoop(): void {
    if (this.isPaused) return;
    this.moveSnake();
    if (this.isGameOverCondition()) {
      clearInterval(this.intervalId);
      this.isGameOver = true;
    } else {
      this.checkFoodCollision();
      this.drawGame();
      this.updateSpeed();
    }
  }

  private moveSnake(): void {
    const newHead = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y
    };
    this.snake.unshift(newHead);
    this.snake.pop();
  }

  private checkFoodCollision(): void {
    if (this.snake[0].x === this.food.x && this.snake[0].y === this.food.y) {
      this.score += 10;
      this.food = this.randomPoint();
      this.eatFoodSound.play(); // Play sound
      this.snake.push({ ...this.snake[this.snake.length - 1] });
    }
  }

  private isGameOverCondition(): boolean {
    const head = this.snake[0];
    if (head.x < 0 || head.x >= 600 / this.gridSize || head.y < 0 || head.y >= 600 / this.gridSize) {
      return true;
    }
    for (let i = 1; i < this.snake.length; i++) {
      if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
        return true;
      }
    }
    return false;
  }

  private drawGame(): void {
    this.ctx.clearRect(0, 0, this.gameCanvas.nativeElement.width, this.gameCanvas.nativeElement.height);

    // Draw canvas background
    this.ctx.fillStyle = '#282c34'; // Dark background color
    this.ctx.fillRect(0, 0, this.gameCanvas.nativeElement.width, this.gameCanvas.nativeElement.height);

    // Apply clipping path for rounded corners
    this.ctx.beginPath();
    this.ctx.moveTo(20, 0);
    this.ctx.arcTo(this.gameCanvas.nativeElement.width, 0, this.gameCanvas.nativeElement.width, this.gameCanvas.nativeElement.height, 20);
    this.ctx.arcTo(this.gameCanvas.nativeElement.width, this.gameCanvas.nativeElement.height, 0, this.gameCanvas.nativeElement.height, 20);
    this.ctx.arcTo(0, this.gameCanvas.nativeElement.height, 0, 0, 20);
    this.ctx.arcTo(0, 0, this.gameCanvas.nativeElement.width, 0, 20);
    this.ctx.closePath();
    this.ctx.clip();

    this.drawGridLines();

    // Draw snake and food
    this.ctx.fillStyle = 'green';
    this.snake.forEach((part, index) => {
      if (index === 0) {
        this.drawCircle(part.x, part.y);
        this.drawEyes(part.x, part.y);
      } else {
        this.drawCircle(part.x, part.y);
      }
    });

    this.ctx.fillStyle = 'red';
    this.drawCircle(this.food.x, this.food.y);

    if (this.isGameOver) {
      this.drawGameOver();
    }
  }

  private drawGridLines(): void {
    this.ctx.strokeStyle = 'darkgray';
    this.ctx.lineWidth = 1;

    for (let x = 0; x < 600; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, 600);
      this.ctx.stroke();
    }

    for (let y = 0; y < 600; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(600, y);
      this.ctx.stroke();
    }
  }

  private drawCircle(x: number, y: number): void {
    const radius = this.gridSize / 2;
    this.ctx.beginPath();
    this.ctx.arc(x * this.gridSize + radius, y * this.gridSize + radius, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = 'black';
    this.ctx.stroke();
  }

  private drawEyes(x: number, y: number): void {
    const radius = this.gridSize / 2;
    const eyeRadius = radius / 4;
    const eyeY = y * this.gridSize + radius - eyeRadius;

    this.ctx.beginPath();
    this.ctx.arc(x * this.gridSize + radius - eyeRadius, eyeY, eyeRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'white';
    this.ctx.fill();
    this.ctx.strokeStyle = 'black';
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(x * this.gridSize + radius + eyeRadius, eyeY, eyeRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'white';
    this.ctx.fill();
    this.ctx.strokeStyle = 'black';
    this.ctx.stroke();
  }

  private drawGameOver(): void {
    this.ctx.fillStyle = 'black';
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Game Over', this.gameCanvas.nativeElement.width / 2, this.gameCanvas.nativeElement.height / 2);
  }

  private randomPoint(): Point {
    const x = Math.floor(Math.random() * (600 / this.gridSize));
    const y = Math.floor(Math.random() * (600 / this.gridSize));
    return this.isValidPoint({ x, y }) ? { x, y } : { x: 0, y: 0 };
  }

  private isValidPoint(point: Point): boolean {
    return point.x >= 0 && point.x < 600 / this.gridSize && point.y >= 0 && point.y < 600 / this.gridSize;
  }

  private getSpeed(): number {
    return Math.max(this.baseSpeed - (this.score / 10) * this.speedIncrement, 100);
  }

  private updateSpeed(): void {
    clearInterval(this.intervalId);
    this.startGame();
  }

  public togglePause(): void {
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.startGame();
    } else {
      clearInterval(this.intervalId);
    }
  }

  public restartGame(): void {
    this.initializeGame();
  }
}
