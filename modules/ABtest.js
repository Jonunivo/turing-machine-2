import { nodeEdgeCreationCount, nodeEdgeCreationCountReset } from "./UserInput.js";
import {nodeEdgeEditCount, nodeEdgeEditCountReset} from "./UserEdit.js";

//File used to gather stats about AB test

let startTime;

const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
let leftclickCount = 0;
let rightclickCount = 0;

//Start Button Pressed
startButton.addEventListener("click", () => {
    startTime = Date.now();
    leftclickCount = 0;
    rightclickCount = 0;
    startButton.disabled = true;
    stopButton.disabled = false;
});
//Stop Button Pressed
stopButton.addEventListener("click", () => {
    startButton.disabled = false;
    stopButton.disabled = true;
    //user id
    console.log("user ID: ", document.getElementById("userId").value);
    resultTimer();
    resultClickCounter();
    resultNodesCreated();
    resultNodesEdited();
});

//Time measurement
function resultTimer() {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000; // Convert milliseconds to seconds
    console.log("Time used:", elapsedTime);
}

//leftclick counter
document.addEventListener("click", (event) => {
    if (event.button === 0) { // Left click
        leftclickCount++;
    }
});
//rightclick counter
document.addEventListener("mousedown", event => {
    if(event.button == 2){
        rightclickCount++;
    }
});

function resultClickCounter(){
    console.log("Leftclicks: ", leftclickCount-1);
    console.log("Rightclicks: ", rightclickCount);
}

function resultNodesCreated(){
    console.log("Nodes Created: ", nodeEdgeCreationCount()[0])
    console.log("Edges Created: ", nodeEdgeCreationCount()[1])
    nodeEdgeCreationCountReset();
}

function resultNodesEdited(){
    console.log("Nodes Edited: ", nodeEdgeEditCount()[0])
    console.log("Edges Edited: ", nodeEdgeEditCount()[1])
    nodeEdgeEditCountReset();
}