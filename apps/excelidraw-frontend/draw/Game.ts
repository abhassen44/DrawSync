import { IShape, Tool } from "../Interfaces/IShape";
import { getExistingShapes } from "./http";

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: IShape[];
  private selectedTool: string = "rect";
  private isDrawing: boolean = false;
  private isPanning: boolean = false;
  private panX: number = 0;
  private panY: number = 0;
  private scale: number = 1;
  private pathErase: [number, number][];
  private startX: number = 0;
  private startY: number = 0;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  onScaleChange?: (scale: number) => void;
  socket: WebSocket;
  private roomId;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.socket = socket;
    this.roomId = roomId;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.selectedTool = Tool.RECTANGEL;
    this.pathErase = [];
    this.init();
    this.initMouseHandlers();
    this.initGetSocketRes();
  }

  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    this.redrawCanvas();
  }

  addAIShape(aiShape: string, position?: { x: number; y: number }) {
    if (aiShape) {
      const cleanPath = aiShape
        .replace(/```(json|xml)?/g, "")
        .replace(/\\n/g, "")
        .trim();
      
      const newShape: IShape = {
        type: "AISvg",
        path: cleanPath,
        position: position
          ? {
              x: (position.x - this.panX) / this.scale,
              y: (position.y - this.panY) / this.scale,
            }
          : { x: 0, y: 0 },
      };

      this.existingShapes.push(newShape);
      
      this.socket.send(
        JSON.stringify({
          type: "chat",
          message: JSON.stringify({ shape: newShape }),
          roomId: this.roomId,
        })
      );
      this.redrawCanvas();
    }
  }

  initGetSocketRes() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "eraser") {
        this.existingShapes = [];
        this.redrawCanvas();
      } else if (message.type === "chat") {
        const parsedShape = JSON.parse(message.message);
        if (parsedShape.shape) {
            this.existingShapes.push(parsedShape.shape);
            this.redrawCanvas();
        }
      }
    };
  }

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("wheel", this.zoomHandler);
    this.setTool(Tool.LINE);
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.removeEventListener("wheel", this.zoomHandler);
  }

  zoomHandler = (e: WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY / 500;
    const newScale = this.scale * (1 + scaleAmount);
    if (newScale < 0.1 || newScale > 5) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const canvasMouseX = (mouseX - this.panX) / this.scale;
    const canvasMouseY = (mouseY - this.panY) / this.scale;

    this.scale = newScale;
    this.onScaleChange?.(this.scale);
    this.panX = mouseX - canvasMouseX * this.scale;
    this.panY = mouseY - canvasMouseY * this.scale;
    this.redrawCanvas();
  };

  inc() {
    this.scale += 0.2;
    this.redrawCanvas();
  }

  dec() {
    this.scale -= 0.2;
    this.redrawCanvas();
  }

  mouseDownHandler = (e: MouseEvent) => {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    this.startX = (mouseX - this.panX) / this.scale;
    this.startY = (mouseY - this.panY) / this.scale;
    this.lastMouseX = mouseX;
    this.lastMouseY = mouseY;

    if (this.selectedTool === Tool.PENCIL) {
      const newShape: IShape = {
        type: Tool.PENCIL,
        points: [{ x: this.startX, y: this.startY }],
      };
      this.existingShapes.push(newShape);
    } else if (this.selectedTool === Tool.PAN) {
      this.isPanning = true;
      this.canvas.style.cursor = "grabbing";
    }
  };

  mouseMoveHandler = (e: MouseEvent) => {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const adjustedX = (mouseX - this.panX) / this.scale;
    const adjustedY = (mouseY - this.panY) / this.scale;

    if (this.isPanning) {
      const deltaX = mouseX - this.lastMouseX;
      const deltaY = mouseY - this.lastMouseY;
      this.panX += deltaX;
      this.panY += deltaY;
      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
      this.redrawCanvas();
      return;
    }
    
    this.redrawCanvas();
    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.scale, this.scale);
    this.ctx.strokeStyle = "#3b82f6";

    if (this.selectedTool === Tool.RECTANGEL) {
      this.ctx.strokeRect(this.startX, this.startY, adjustedX - this.startX, adjustedY - this.startY);
    } else if (this.selectedTool === Tool.CIRCLE) {
      const radius = Math.sqrt(Math.pow(adjustedX - this.startX, 2) + Math.pow(adjustedY - this.startY, 2));
      this.ctx.beginPath();
      this.ctx.arc(this.startX, this.startY, Math.abs(radius), 0, 2 * Math.PI);
      this.ctx.stroke();
    } else if (this.selectedTool === Tool.PENCIL) {
        const currentShape = this.existingShapes[this.existingShapes.length - 1];
        if (currentShape?.type === Tool.PENCIL) {
            currentShape.points.push({ x: adjustedX, y: adjustedY });
        }
    } else if (this.selectedTool === Tool.LINE) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(adjustedX, adjustedY);
        this.ctx.stroke();
    }
    this.ctx.restore();
  };

  mouseUpHandler = (e: MouseEvent) => {
    this.isDrawing = false;
    this.isPanning = false;
    this.canvas.style.cursor = "crosshair";

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const adjustedX = (mouseX - this.panX) / this.scale;
    const adjustedY = (mouseY - this.panY) / this.scale;

    let shape: IShape | null = null;
    
    if (this.selectedTool === Tool.RECTANGEL) {
      shape = {
        type: Tool.RECTANGEL,
        x: this.startX,
        y: this.startY,
        width: adjustedX - this.startX,
        height: adjustedY - this.startY,
      };
    } else if (this.selectedTool === Tool.CIRCLE) {
      const radius = Math.sqrt(Math.pow(adjustedX - this.startX, 2) + Math.pow(adjustedY - this.startY, 2));
      shape = {
        type: Tool.CIRCLE,
        centerX: this.startX,
        centerY: this.startY,
        radius: Math.abs(radius),
      };
    } else if (this.selectedTool === Tool.PENCIL) {
        const currentShape = this.existingShapes[this.existingShapes.length - 1];
        if (currentShape) {
          this.socket.send(JSON.stringify({ type: "chat", message: JSON.stringify({ shape: currentShape }), roomId: this.roomId }));
        }
    } else if (this.selectedTool === Tool.LINE) {
      shape = {
        type: Tool.LINE,
        points: [{ x: this.startX, y: this.startY }, { x: adjustedX, y: adjustedY }],
      };
    } else if (this.selectedTool === Tool.ERASER) {
        this.existingShapes = [];
        this.socket.send(JSON.stringify({ type: "eraser", roomId: this.roomId }));
    }

    if (shape) {
      this.existingShapes.push(shape);
      this.socket.send(JSON.stringify({ type: "chat", message: JSON.stringify({ shape }), roomId: this.roomId }));
    }
    this.redrawCanvas();
  };

  setTool(tool: Tool) {
    this.selectedTool = tool;
    this.canvas.style.cursor = tool === Tool.PAN ? "grab" : "crosshair";
  }

  redrawCanvas() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.scale, this.scale);

    this.existingShapes.forEach((shape) => {
      this.drawShape(shape);
    });
    this.ctx.restore();
  }

  drawShape(shape: IShape) {
    this.ctx.strokeStyle = "#3b82f6";
    this.ctx.lineWidth = 2;

    if (shape.type === Tool.RECTANGEL) {
      this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === Tool.CIRCLE) {
      this.ctx.beginPath();
      this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
      this.ctx.stroke();
    } else if (shape.type === Tool.LINE) {
        this.ctx.beginPath();
        this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
        this.ctx.lineTo(shape.points[1].x, shape.points[1].y);
        this.ctx.stroke();
    } else if (shape.type === Tool.PENCIL) {
        this.ctx.beginPath();
        this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
        shape.points.forEach((point) => this.ctx.lineTo(point.x, point.y));
        this.ctx.stroke();
    } else if (shape.type === "AISvg") {
      this.drawAISvg(shape);
    }
  }

  drawAISvg(shape: IShape) {
    if (shape.type === "AISvg" && shape.position) {
        const path = new Path2D(shape.path);
        this.ctx.fillStyle = shape.fillStyle || "transparent";
        this.ctx.strokeStyle = shape.strokeStyle || "#FF0000";
        this.ctx.lineWidth = shape.lineWidth || 2;
        this.ctx.save();
        this.ctx.translate(shape.position.x, shape.position.y);
        this.ctx.stroke(path);
        this.ctx.fill(path);
        this.ctx.restore();
    }
  }
}