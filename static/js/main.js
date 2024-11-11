let points = [];
let obstacles = []; // Array to hold all obstacle polygons
let currentObstacle = [];
let isDrawingObstacle = false;

let canvas, ctx, image;


// Function to add a new obstacle
function addObstacle(points) {
    obstacles.push(points);
}

// Function to send obstacles to the server
function sendObstacles() {
    $.ajax({
        url: '/cut_polygon',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ obstacles: obstacles }),
        success: function(response) {
            console.log("Obstacles masked on image.");
        }
    });
}


function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function drawPolygon(polygon, color = 'red') {
    if (polygon.length > 0) {
        ctx.beginPath();
        ctx.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 1; i < polygon.length; i++) {
            ctx.lineTo(polygon[i].x, polygon[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function drawAllPolygons() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    drawPolygon(points, 'red'); // Draw main rooftop polygon
    obstacles.forEach(obstacle => drawPolygon(obstacle, 'blue')); // Draw each obstacle polygon
}

function calculateArea() {
    const formattedPoints = points.map(point => [point.x, point.y]);
    $.ajax({
        type: 'POST',
        url: '/calculate_area',
        contentType: 'application/json',
        data: JSON.stringify({
            points: formattedPoints,
            latitude: 13.1038889,
            zoom: 21
        }),
        success: function(response) {
            $('#result').text(`Area: ${response.area.toFixed(2)} square feet`);
        }
    });
}

function cutPolygon() {
    const formattedPoints = points.map(point => [point.x, point.y]);
    const formattedObstacles = obstacles.map(polygon => polygon.map(point => [point.x, point.y]));

    $.ajax({
        type: 'POST',
        url: '/cut_polygon',
        contentType: 'application/json',
        data: JSON.stringify({ points: formattedPoints, obstacles: formattedObstacles }),
        success: function(response) {
            window.location.href = '/solar_panels';
        }
    });
}

$(document).ready(function() {
    canvas = document.getElementById('drawing-canvas');
    ctx = canvas.getContext('2d');
    image = document.getElementById('satellite-image');

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    canvas.addEventListener('click', function(evt) {
        let pos = getMousePos(canvas, evt);
        if (isDrawingObstacle) {
            currentObstacle.push(pos);
            drawAllPolygons();
            drawPolygon(currentObstacle, 'blue');
        } else {
            points.push(pos);
            drawAllPolygons();
        }
    });

    $('#calculate-area-btn').click(calculateArea);

    $('#cut-polygon-btn').click(cutPolygon);

    $('#add-obstacle-btn').click(function() {
        if (currentObstacle.length > 0) {
            obstacles.push([...currentObstacle]);
            currentObstacle = [];
        }
        isDrawingObstacle = true;
    });

    $('#stop-drawing-obstacle-btn').click(function() {
        isDrawingObstacle = false;
        if (currentObstacle.length > 0) {
            obstacles.push([...currentObstacle]);
            currentObstacle = [];
        }
        drawAllPolygons();
    });
});
