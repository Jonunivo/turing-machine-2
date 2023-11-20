//this file was once used to gather AB Test statistics, not used anymore
/*
import { nodeEdgeCreationCount, nodeEdgeCreationCountReset } from "./UserInput.js";
import {nodeEdgeEditCount, nodeEdgeEditCountReset} from "./UserEdit.js";


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

    //disable all non-necessary things
    document.getElementById('resetSimulationButton').disabled = true;
    document.getElementById('runSimulationButton').disabled = true;
    document.getElementById('stepSimulationButton').disabled = true;
    document.getElementById('move-tape-right').disabled = true;
    document.getElementById('move-tape-left').disabled = true;
    document.getElementById('tape-input').disabled = true;
    document.getElementById('tape-input-field').disabled = true;
    document.getElementById('saveButton').disabled = true;
    document.getElementById('fileInput').disabled = true;



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

    //reenable things
    document.getElementById('resetSimulationButton').disabled = false;
    document.getElementById('runSimulationButton').disabled = false;
    document.getElementById('stepSimulationButton').disabled = false;
    document.getElementById('move-tape-right').disabled = false;
    document.getElementById('move-tape-left').disabled = false;
    document.getElementById('tape-input').disabled = false;
    document.getElementById('tape-input-field').disabled = false;
    document.getElementById('saveButton').disabled = false;
    document.getElementById('fileInput').disabled = false;
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
*/