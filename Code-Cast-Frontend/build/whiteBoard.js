// eslint-disable-next-line no-undef
const io = require("socket.io-client");
const socket = io("localhost:3001");
socket.on("connect", () => {
    console.log("connected", socket.id);
});

const canvas = document.querySelector(' #white-board canvas');
const ctx = canvas.getContext('2d');
const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight - 80 - 50;
let time = performance.now();
const cursor = document.querySelector("#cursor");
const shapeDemo = document.querySelector("#shape-demo");

let interval = 0;
let colorInterval = 0;
let prevX = 0;
let prevY = 0;
let x = 0;
let y = 0;
const triangle = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
const rectangle = [0, 0, 0, 0];
const circle = [0, 0, 0, 0, 0];


const whiteBoard = document.querySelector("#white-board");
const data = { color: "black", thickness: 1 };
const colors = document.querySelectorAll(".colors .color");
const sizes = document.querySelectorAll(".sizes .size");
const eraser = document.querySelector("#eraser");
const shapes = document.querySelectorAll(".shapes .shape");
// click events

colors.forEach((color, index) => {
    color.addEventListener("click", () => {
        clearInterval(colorInterval);
        colors.forEach(color => color.classList.remove("active"));
        color.classList.add("active");
        sizes[data.thickness - 1].classList.add("active");
        eraser.classList.remove("active");
        if (index == colors.length - 1) {
            changeContinuous();
        } else {
            data.color = getComputedStyle(color).getPropertyValue("--color");
            ctx.strokeStyle = data.color;
            ctx.lineWidth = data.thickness;
        }
        changeColorShape();
    })
})

sizes.forEach(size => {
    size.addEventListener("click", () => {
        sizes.forEach(size => size.classList.remove("active"));
        size.classList.add("active");
        eraser.classList.remove("active");
        colors.forEach(color => {
            if (getComputedStyle(color).getPropertyValue("--color") == data.color) {
                color.classList.add("active");
            }
        });
        data.thickness = getComputedStyle(size).getPropertyValue("--width");
        ctx.lineWidth = data.thickness;
        ctx.strokeStyle = data.color;
    })
})

function changeContinuous() {
    colorInterval = setInterval(() => {
        ctx.strokeStyle = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
        data.color = ctx.strokeStyle;
    }, 300);
}

const clearScreenBtn = document.querySelector("#clearScreen");
clearScreenBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, width, height);
});

eraser.addEventListener("click", () => {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 20;
    eraser.classList.add("active");
    sizes.forEach(size => size.classList.remove("active"));
    colors.forEach(color => color.classList.remove("active"));
    shapes.forEach(shape => shape.classList.remove("active"));
    pen.classList.remove("active")
    clearInterval(colorInterval);
})

const pen = document.querySelector("#pen");

pen.addEventListener("click", () => {
    ctx.lineWidth = data.thickness;
    ctx.strokeStyle = data.color;
    shapes.forEach(shape => shape.classList.remove("active"));
    eraser.classList.remove("active");
    clearInterval(colorInterval);
    pen.classList.add("active")
    changeColorShape();
    sizes[data.thickness - 1].classList.add("active");
    colors.forEach(color => {
        if (getComputedStyle(color).getPropertyValue("--color") == data.color) {
            color.classList.add("active");
        }
    });
})

shapes.forEach(shape => {
    shape.addEventListener("click", () => {
        shapes.forEach(shape => shape.classList.remove("active"));
        pen.classList.remove("active");
        shape.classList.add("active");
        eraser.classList.remove("active");
        ctx.lineWidth = data.thickness;
        ctx.strokeStyle = data.color;
        sizes[data.thickness - 1].classList.add("active");
        colors.forEach(color => {
            if (getComputedStyle(color).getPropertyValue("--color") == data.color) {
                color.classList.add("active");
            }
        });
        clearInterval(colorInterval);
        changeColorShape();
    })
})

function changeColorShape() {
    const shapes = document.querySelectorAll(".shapes .shape, .shapes #pen");
    shapes.forEach(shape => {
        if (shape.classList.contains("active")) {
            shape.style.color = data.color;
            shape.style.borderColor = data.color;
        } else {
            shape.style.color = "black";
            shape.style.borderColor = "black";
        }
    })
}


// event listeners

window.addEventListener('mousemove', (e) => {
    if (!whiteBoard.classList.contains("active")) return;
    if (e.target != canvas) {
        cursor.style.display = "none";
        whiteBoard.style.cursor = "default";
        return;
    }
    cursor.style.display = "block";
    whiteBoard.style.cursor = "none";
    if (eraser.classList.contains("active")) {
        cursor.style.backgroundImage = "url('./eraser.png')"
    } else if (pen.classList.contains("active")) {
        cursor.style.backgroundImage = "url('./pencil.png')"
    } else {
        whiteBoard.style.cursor = "crosshair";
        cursor.style.backgroundImage = "none";

    }
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
    if (performance.now() - time < 10) return;
    prevX = x;
    prevY = y;
    x = e.offsetX;
    y = e.offsetY;
    time = performance.now();
})

canvas.addEventListener('mousedown', (e) => {
    const shape = Array.from(shapes).find(shape => shape.classList.contains("active"));
    if (shape) {
        triangle[0].x = e.offsetX;
        triangle[1].y = e.offsetY;
        rectangle[0] = e.offsetX;
        rectangle[1] = e.offsetY;
        circle[0] = e.offsetX;
        circle[1] = e.offsetY;

        canvas.addEventListener("mousemove", callDrawShape);

        function callDrawShape(e) {
            drawShape(e, shape);
        }

        canvas.addEventListener("mouseup", () => {
            canvas.removeEventListener("mousemove", callDrawShape);
            if (shape.id == "triangle") {
                drawTriangle()
            } else if (shape.id == "rectangle") {
                drawRectangle()
            } else {
                drawCircle();
            }
        }, { once: true })


        return;
    };
    interval = setInterval(() => drawLine(), 10);
})

canvas.addEventListener('mouseup', () => {
    if (Array.from(shapes).some(shape => shape.classList.contains("active"))) return;
    clearInterval(interval);
})

canvas.addEventListener("mouseleave", () => {
    clearInterval(interval);
})

function drawLine() {
    ctx.beginPath();
    ctx.strokeStyle = eraser.classList.contains("active") ? "#fff" : data.color;
    ctx.moveTo(prevX, prevY)
    ctx.lineTo(x, y);
    ctx.stroke();
    // socket.emit("drawData", { prevX, prevY, x, y, color: data.color, thickness: data.thickness, shape: eraser.classList.contains("active") ? "eraser" : "pen" });
}


function drawShape(e, shape) {
    const toolbar = document.querySelector(".toolbar");
    if (shape.id == "triangle") {
        triangle[0].y = e.offsetY;
        triangle[2].x = e.offsetX;
        triangle[2].y = e.offsetY;
        triangle[1].x = (triangle[0].x + triangle[2].x) / 2;
    }

    if (shape.id == "rectangle") {
        rectangle[2] = e.offsetX;
        rectangle[3] = e.offsetY;
        shapeDemo.style.borderRadius = "0%";
        shapeDemo.style.left = rectangle[0] + "px";
        shapeDemo.style.top = rectangle[1] + toolbar.offsetHeight + "px";
        shapeDemo.style.width = rectangle[2] - rectangle[0] + "px";
        shapeDemo.style.height = rectangle[3] - rectangle[1] + "px";
    }

    if (shape.id == "circle") {
        circle[2] = (e.offsetX - circle[0]) / 2 + circle[0];
        circle[3] = (e.offsetY - circle[1]) / 2 + circle[1];
        circle[4] = Math.sqrt(Math.pow(e.offsetX - circle[2], 2) + Math.pow(e.offsetY - circle[3], 2));
        shapeDemo.style.borderRadius = "50%";
        shapeDemo.style.left = circle[2] - circle[4] + "px";
        shapeDemo.style.top = circle[3] - circle[4] + toolbar.offsetHeight + "px";
        shapeDemo.style.width = circle[4] * 2 + "px";
        shapeDemo.style.height = circle[4] * 2 + "px"

    }
}

function drawTriangle() {
    ctx.fillStyle = data.color;
    ctx.lineWidth = data.thickness;
    ctx.beginPath();
    ctx.moveTo(triangle[0].x, triangle[0].y);
    ctx.lineTo(triangle[1].x, triangle[1].y);
    ctx.lineTo(triangle[2].x, triangle[2].y);
    ctx.lineTo(triangle[0].x, triangle[0].y);
    ctx.stroke();
    shapeDemo.style.width = shapeDemo.style.height = 0;
    // socket.emit("drawData", { triangle, color: data.color, thickness: data.thickness, shape: "triangle" });
}

function drawRectangle() {
    ctx.fillStyle = data.color;
    ctx.lineWidth = data.thickness;
    ctx.beginPath();
    ctx.rect(rectangle[0], rectangle[1], rectangle[2] - rectangle[0], rectangle[3] - rectangle[1]);
    ctx.stroke();
    shapeDemo.style.width = shapeDemo.style.height = 0;
    // socket.emit("drawData", { rectangle, color: data.color, thickness: data.thickness, shape: "rectangle" });
}

function drawCircle() {
    ctx.fillStyle = data.color;
    ctx.lineWidth = data.thickness;
    ctx.beginPath();
    ctx.arc(circle[2], circle[3], circle[4], 0, 2 * Math.PI);
    ctx.stroke();
    shapeDemo.style.width = shapeDemo.style.height = 0;

    // socket.emit("drawData", { x: circle[2], y: circle[3], radius: circle[4], color: data.color, thickness: data.thickness, shape: "circle" });
}

// socket.on("drawData", (data) => {
//     ctx.strokeStyle = data.color;
//     ctx.lineWidth = data.thickness;
//     if (data.shape === "triangle") {
//         ctx.beginPath();
//         ctx.moveTo(data.triangle[0].x, data.triangle[0].y);
//         ctx.lineTo(data.triangle[1].x, data.triangle[1].y);
//         ctx.lineTo(data.triangle[2].x, data.triangle[2].y);
//         ctx.lineTo(data.triangle[0].x, data.triangle[0].y);
//         ctx.stroke();
//         return;
//     }
//     if (data.shape === "rectangle") {
//         ctx.beginPath();
//         ctx.rect(data.rectangle[0], data.rectangle[1], data.rectangle[2] - data.rectangle[0], data.rectangle[3] - data.rectangle[1]);
//         ctx.stroke();
//         return;
//     }
//     if (data.shape === "circle") {
//         ctx.beginPath();
//         ctx.arc(data.x, data.y, data.radius, 0, 2 * Math.PI);
//         ctx.stroke();
//         return;
//     }
//     if (data.shape === "eraser") {
//         ctx.lineWidth = 20;
//         ctx.strokeStyle = "#fff";
//     }
//     ctx.beginPath();
//     ctx.moveTo(data.prevX, data.prevY)
//     ctx.lineTo(data.x, data.y);
//     ctx.stroke();
// });
