import {
  Area,
  Camera,
  CollisionBody,
  CollisionLayers,
  GameContext,
  RectangleCollisionShape,
  StaticCollisionBody,
  Vector2D,
} from 'jf-canvas-game-engine';

import { gravity, maxFallSpeed } from './globalValues';
import { Platform } from './Platform';

export class Player extends CollisionBody {
  #width = 50;
  #height = 50;
  #jumpForce = 1600;
  #moveAcceleration = 1000;
  #maxMoveSpeed = 500;
  #camera = new Camera(new Vector2D(0, 0));
  #velocity = new Vector2D(0, 0);
  #headArea: Area;
  #feetArea: Area;
  #leftArea: Area;
  #rightArea: Area;
  #image: HTMLImageElement;
  hasWon = false;
  isBeingSucked = false;
  #scale = new Vector2D(1, 1);
  #rotation = 0;
  constructor(position: Vector2D) {
    super(
      position,
      new RectangleCollisionShape(new Vector2D(-25, -25), 50, 50)
    );

    this.#image = document.createElement('img');
    this.#image.src = 'pngegg.png';

    this.getCollisionLayers().setLayer(2, true);

    this.addChild(this.#camera);
    GameContext.getInstance().setActiveCamera(this.#camera);

    this.#headArea = new Area(
      new Vector2D(0, -25),
      new RectangleCollisionShape(new Vector2D(-20, 0), 40, 5)
    );

    this.addChild(this.#headArea);

    this.#feetArea = new Area(
      new Vector2D(0, 25),
      new RectangleCollisionShape(new Vector2D(-20, -5), 40, 5)
    );

    this.addChild(this.#feetArea);

    this.#leftArea = new Area(
      new Vector2D(-25, 0),
      new RectangleCollisionShape(new Vector2D(0, -20), 5, 40)
    );

    this.addChild(this.#leftArea);

    this.#rightArea = new Area(
      new Vector2D(25, 0),
      new RectangleCollisionShape(new Vector2D(-5, -20), 5, 40)
    );

    this.addChild(this.#rightArea);
  }

  isGrounded(): boolean {
    const collidingBodies = this.#feetArea.getCollidingBodies();

    for (const body of collidingBodies) {
      if (body instanceof StaticCollisionBody) {
        return true;
      }
    }

    return false;
  }

  #applyGravity(delta: number): void {
    this.#velocity = this.#velocity.add(new Vector2D(0, gravity * delta));
  }

  #wantToMoveLeft(): boolean {
    return GameContext.getInstance().isPressed('a');
  }

  #wantToMoveRight(): boolean {
    return GameContext.getInstance().isPressed('d');
  }

  #moveLeft(delta: number): void {
    this.#velocity = this.#velocity.add(
      new Vector2D(-this.#moveAcceleration * delta, 0)
    );
  }

  #moveRight(delta: number): void {
    this.#velocity = this.#velocity.add(
      new Vector2D(this.#moveAcceleration * delta, 0)
    );
  }

  #wantToJump(): boolean {
    return GameContext.getInstance().isJustPressed(' ');
  }

  #jump(delta: number): void {
    this.#velocity = this.#velocity.add(new Vector2D(0, -this.#jumpForce));
  }

  #bumpedHead(): boolean {
    const collidingBodies = this.#headArea.getCollidingBodies();

    for (const body of collidingBodies) {
      if (body instanceof StaticCollisionBody) {
        return true;
      }
    }

    return false;
  }

  #bumbedLeft(): boolean {
    const collidingBodies = this.#leftArea.getCollidingBodies();

    for (const body of collidingBodies) {
      if (body instanceof StaticCollisionBody) {
        return true;
      }
    }

    return false;
  }

  #bumpedRight(): boolean {
    const collidingBodies = this.#rightArea.getCollidingBodies();

    for (const body of collidingBodies) {
      if (body instanceof StaticCollisionBody) {
        return true;
      }
    }

    return false;
  }

  override process(delta: number): void {
    if (this.isBeingSucked) {
      this.#velocity = new Vector2D(0, 0);
      const scaleFactor = Math.exp(-Math.log(2) * delta);
      this.#scale = this.#scale.multiply(scaleFactor);
      this.#rotation += Math.PI * delta;
    } else if (this.hasWon) {
      this.#velocity = new Vector2D(0, -150);
      this.position = this.position.add(this.#velocity.multiply(delta));
    } else {
      if (this.#bumpedHead()) {
        this.#velocity = new Vector2D(this.#velocity.x, 0);
      }
      if (!this.isGrounded()) {
        this.#applyGravity(delta);
      } else {
        this.#velocity = new Vector2D(this.#velocity.x, 0);
      }

      if (this.#bumbedLeft() && this.#velocity.x < 0) {
        this.#velocity = new Vector2D(0, this.#velocity.y);
      }

      if (this.#bumpedRight() && this.#velocity.x > 0) {
        this.#velocity = new Vector2D(0, this.#velocity.y);
      }

      if (this.#wantToMoveLeft()) {
        this.#moveLeft(delta);
      }

      if (this.#wantToMoveRight()) {
        this.#moveRight(delta);
      }

      if (this.#wantToJump() && this.isGrounded()) {
        this.#jump(delta);
      }

      if (this.#velocity.y > maxFallSpeed) {
        this.#velocity = new Vector2D(this.#velocity.x, maxFallSpeed);
      }

      if (this.#velocity.x > this.#maxMoveSpeed) {
        this.#velocity = new Vector2D(this.#maxMoveSpeed, this.#velocity.y);
      }

      if (this.#velocity.x < -this.#maxMoveSpeed) {
        this.#velocity = new Vector2D(-this.#maxMoveSpeed, this.#velocity.y);
      }

      this.position = this.position.add(this.#velocity.multiply(delta));

      if (delta > 0) {
        const decayFactor = Math.exp(-Math.log(2) * delta);
        this.#velocity = new Vector2D(
          this.#velocity.x * decayFactor,
          this.#velocity.y
        );
        if (Math.abs(this.#velocity.x) < 1) {
          this.#velocity = new Vector2D(0, this.#velocity.y);
        }
      }
    }
  }

  override render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    ctx.translate(this.position.x, this.position.y);
    if (this.isBeingSucked) {
      ctx.scale(this.#scale.x, this.#scale.y);
      ctx.rotate(this.#rotation);
    } else if (!this.hasWon) {
      if (this.#wantToMoveRight()) {
        ctx.scale(-1, 1);
      } else if (this.#wantToMoveLeft()) {
        ctx.scale(1, 1);
      } else if (this.#velocity.x > 0) {
        ctx.scale(-1, 1);
      }
    }

    ctx.drawImage(this.#image, -this.#width / 2, -this.#height / 2);

    ctx.restore();
  }
}
