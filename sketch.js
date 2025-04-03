// Hand Pose Painting with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video, guis, cGuis, slider, button, btn2;
let handPose;
let hands = [];
let colours = [];
let cols = [[102, 16, 242], [209, 17, 73], [230, 194, 41], [241, 113, 5], [26, 143, 227]];
let painting;
let px = 0;
let py = 0;
//kaleidscope
let symmetry = 6;
let angle = 360 / symmetry;
let currStrokeW = 3;
let colorVal = [255, 255, 255];
let winWidth;
let winHeight;
class colorSelector {

    constructor(r, g, b, size, x, y) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.size = size;
        this.x = x;
        this.y = y;
        this.actualx = 0;
        this.selected = false;
    }

    show(offset) {
        rectMode(CENTER);
        cGuis.strokeWeight(this.selected ? 4 : 1);
        cGuis.stroke(this.selected ? 255 : 0);
        cGuis.fill(this.r, this.g, this.b);
        cGuis.rect(this.x * offset, this.y, this.size, this.size);
        this.actualx = this.x * offset;

    }
    selectColor() {
        colorVal[0] = this.r;
        colorVal[1] = this.g;
        colorVal[2] = this.b;
    }

}
function preload() {
    // Initialize HandPose model with flipped video input
    handPose = ml5.handPose({ flipped: true });
    winWidth = windowWidth / 2;
    winHeight = windowHeight / 2;
}

function mousePressed() {
    console.log(hands[0]);
}

function gotHands(results) {
    hands = results;
}
function drawKaleid(hx, hy, phx, phy) {
    //console.log(hx, hy);
    painting.push();
    painting.translate(winWidth / 2, winHeight / 2);
    let lineStartX = phx - width / 2;
    let lineStartY = phy - height / 2;
    let lineEndX = hx - width / 2;
    let lineEndY = hy - height / 2;

    for (let i = 0; i < symmetry; i++) {
        painting.rotate(angle);
        painting.stroke(colorVal[0], colorVal[1], colorVal[2]);
        painting.strokeWeight(currStrokeW);
        painting.line(lineStartX, lineStartY, lineEndX, lineEndY);

        // ... and reflect the line within the symmetry sections as well.
        painting.push();
        painting.scale(1, -1);
        painting.line(lineStartX, lineStartY, lineEndX, lineEndY);
        painting.pop();
    }
    painting.pop();
}

function setup() {
    createCanvas(winWidth * 2, winHeight);
    angleMode(DEGREES);
    //rectMode(CENTER);
    // Create an off-screen graphics buffer for layers
    guis = createGraphics(winWidth, winHeight);
    cGuis = createGraphics(winWidth, winHeight);
    painting = createGraphics(winWidth, winHeight);
    //painting.translate(windowWidth - winWidth, winHeight);

    painting.clear();
    cGuis.clear();
    //Dom set up
    slider = createSlider(0.1, 0.5, 0.5, 0.1);
    slider.position(winWidth - 100, 15);
    slider.size(80);
    button = createButton("Reset");
    button.position(0, winHeight);
    button.mousePressed(clearCanvas);
    button.addClass('btn');
    //save button
    btn2 = createButton("Save");
    btn2.position(60, winHeight);
    btn2.mousePressed(saveWork);
    btn2.addClass('btn');

    //load up all the color selection;
    for (let i = 0; i < cols.length; i++) {
        let _x = i * (50 + 20);
        //console.log("x:" + off);
        let colour = new colorSelector(cols[i][0], cols[i][1], cols[i][2], 50, _x, 20);
        colours.push(colour);
    }

    //create Videos
    video = createCapture(VIDEO, { flipped: true });
    video.hide();

    // Start detecting hands
    handPose.detectStart(video, gotHands);
}

function draw() {
    image(video, 0, 0, winWidth, winHeight);
    guis.clear();
    text("Scale" + slider.value(), winWidth - 100, 15)
    // Ensure at least one hand is detected
    if (hands.length > 0) {
        let hand = hands[0];
        let index = hand.index_finger_tip;
        let thumb = hand.thumb_tip;

        // Compute midpoint between index finger and thumb
        let x = (index.x + thumb.x) * 0.5;
        let y = (index.y + thumb.y) * 0.5;

        // Draw only if fingers are close together
        let d = dist(index.x, index.y, thumb.x, thumb.y);
        if (hand.handedness == "Right") {
            console.log("right");
            if (d < 20) {
                // painting.stroke(255, 255, 0);
                // painting.strokeWeight(8);
                // painting.line(px, py, x, y);
                drawKaleid(x + winWidth, y, px + winWidth, py);
            }

        } else if (hand.handedness == "Left") {
            //use left hand to control line weight;
            //console.log(hand.handedness);
            if (d >= 3 && d < 45 && thumb.z3D < 0) {
                currStrokeW = d * slider.value();
                guis.ellipse(x, y, d);
                console.log(d);
            }

            let changedCol = false;
            for (let i = 0; i < colours.length; i++) {
                //console.log(colours[i]);
                changedCol = determineColor(colours[i], index);
                if (changedCol == true) {
                    colours[i].selectColor();
                    console.log(colorVal);
                    break;
                } else {
                    colours[i].selected = false;
                }
            }
        }

        // Update previous position
        px = x;
        py = y;
    }

    //show color selection
    for (let i = 0; i < colours.length; i++) {

        colours[i].show(1);
    }

    // Overlay painting on top of the video

    image(painting, 0, 0, winWidth, 0);
    image(guis, 0, 0);
    image(cGuis, 0, 0);
}
function determineColor(col, indexTip) {
    let detected = false;
    let offset = col.size / 2;
    let y_center = col.y + offset;
    let x_center = col.actualx + offset;

    if (indexTip.y < y_center + offset && indexTip.y > y_center - offset) {
        if (indexTip.x < x_center + offset && indexTip.x > x_center - offset) {
            console.log("touching colorVals" + col.r + col.g);
            col.selected = true;
            detected = true;
        } else {
            col.selected = false;
        }

    }
    return detected;
}
function clearCanvas() {
    painting.clear();
}
function saveWork() {
    painting.save();
}
