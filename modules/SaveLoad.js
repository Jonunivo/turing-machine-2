import { cy, cyClearCanvas, cyCreateEdge, cyCreateNode, moveNodesIntoWindow, cyGrabifyNodes } from "./Cytoscape.js";
import { cyWriteOnTape } from "./CytoscapeTape.js";
import { State } from "./State.js";
import { TuringMachine, turingMachine } from "./TuringMachine.js"
import { tmTree, setTmTree, setCurrTreeNode, createCytoWindow} from "./SuperStates.js";
import { Tree, TreeNode } from "../datastructures/Tree.js";
import {nodePresetHelper, nodePresetReset} from "./UserInput.js";
import {simulationReset, enableButtons} from "./Simulation.js";
import { cyTreeCreate } from "./CytoscapeTree.js";

export {loadFile};


//global Variables
//Array of TM properties to be saved
let tmProperties = []
//Line of Read Cursor
let lineId = 0;

//////////////////////////////////////////////////////////////
//// --------------------- Saving ----------------------- ////
//////////////////////////////////////////////////////////////
/**
 * Saving works as follows:
 * User presses SaveButton -> saveTuringMachine() -> Modal open
 * -> User makes Modal input
 * (1) presses Save in Modal -> saveFile() & close Modal
 * (2) User presses Cancel -> close Modal
 */

/**
 * Puts States & Transitions of TM into imProperties array & opens SaveModal
 * called when user presses "Save TM"
 */
function saveTuringMachine(){

    //Open Save File Modal
    document.getElementById("saveModal").style.display = "block";


    //// Global TM
    tmProperties = [];
    //convert states to JSON
    for(const state of turingMachine.states){
        tmProperties.push(JSON.stringify(state));
    }

    //line break
    tmProperties.push('\n');

    //convert transitions to JSON
    for(const [key, value] of turingMachine.delta){
        //[fromState{properties(5)}, readChar, toState{properties(5)}, writeChar, move]
        tmProperties.push([key[0].id, key[0].name, key[0].isStarting, key[0].isAccepting, key[0].isRejecting, 
            key[1], value[0].id, value[0].name, value[0].isStarting, value[0].isAccepting, value[0].isRejecting,
            value[1], value[2]]);
    }

    tmProperties.push("\n");

    ////Local TMs   
    let nodes = [];
    nodes.push(tmTree.root);
    while(nodes.length > 0){
        //pop first element
        let currNode = nodes.shift();

        //push properties of this node to file
        //superNodeId
        tmProperties.push(currNode.superNodeId);
        //parent superNodeId
        if(currNode !== tmTree.root){
            tmProperties.push(currNode.parent.superNodeId);
        }
        else{
            tmProperties.push(-1);
        }

        tmProperties.push("\n");

        //TM
        for(const state of currNode.turingMachine.states){
            tmProperties.push(JSON.stringify(state));
        }
        tmProperties.push("\n");
        for(const [key, value] of currNode.turingMachine.delta){
            //[fromState{properties(5)}, readChar, toState{properties(5)}, writeChar, move]
            tmProperties.push([key[0].id, key[0].name, key[0].isStarting, key[0].isAccepting, key[0].isRejecting, 
                key[1], value[0].id, value[0].name, value[0].isStarting, value[0].isAccepting, value[0].isRejecting,
                value[1], value[2]]);
        }
        tmProperties.push("\n");
        //nodePositions
        for(const [key, value] of currNode.nodePositions){
            //[nodeId] -> [nodeXPos, nodeYPos]
            tmProperties.push([key, value[0], value[1]])
        }
        //parent

        //children (dont need to be saved)
        

        //add all children to list
        for(let i = 0; i<currNode.children.length; i++){
            nodes.push(currNode.children[i]);
        }
        tmProperties.push("\n");

    }
}
//EventListener for SaveButton
document.getElementById("saveButton").addEventListener("click", saveTuringMachine);


/**
 * 
 * Reads User Modal input & saves Tape if requested
 * Handles all the file creation & download part
 * 
 * @returns - aborts when user doesn't provide a filename (cancelled saving file prompt);
 *              otherwise returns nothing.
 */
function saveFile(){

    //close the modal
    document.getElementById("saveModal").style.display = "none";
    //get user input
    const filename = document.getElementById("filenameInput").value;
    if(!filename){
        //user cancelled prompt
        return;
    }

    if(document.getElementById("saveTape").checked){
        //also save tape content
        tmProperties.push(turingMachine.tape);
    }
    tmProperties.push("\n");

    //convert data to string
    const tmPropString = tmProperties.join('\n');

    // Create a Blob containing the serialized data
    const blob = new Blob([tmPropString], { type: 'application/json' });

    // Create a downloadable link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);

    // Set suggested filename for the downloaded file
    downloadLink.download = filename;

    // Append the link to the DOM (optional)
    document.body.appendChild(downloadLink);

    // Programmatically trigger the download
    downloadLink.click();

    // Clean up the object URL
    URL.revokeObjectURL(downloadLink.href);
}
document.getElementById("saveConfirm").addEventListener("click", saveFile);
//Cancel button pressed
document.getElementById("cancelButton3").addEventListener('click', function(){
    document.getElementById("saveModal").style.display = "none";
})


//////////////////////////////////////////////////////////////
//// -------------------- Loading ----------------------- ////
//////////////////////////////////////////////////////////////

/**
 * Handles the whole loading process from Prompting the user to submit file until creating all the
 * necessary cytoscape objects & handle turingMachine object specifically:
 *  - Prompt User to input file
 *  - Resets TM & canvas
 *  - Load States & Transitions at position specified in savefile
 *  - load Tape content (if provided)
 */
document.getElementById('fileInput').addEventListener('change', (event) => {
    const fileList = event.target.files;
    if(fileList.length != 1){
        //not 1 file selected
        return;
    }
    //load file
    const file = fileList[0];
    const reader = new FileReader();
    reader.readAsText(file);

    loadFile(reader);

   

});

function loadFile(reader){
     ////read file content
     reader.onload = (event) => {
        const fileContent = event.target.result;
        //split into lines
        const lines = fileContent.split('\n');

        //// core 
        //reset TM & canvas & simulation
        turingMachine.createTuringMachineBasic();
        cyClearCanvas();
        nodePresetReset();
        simulationReset();
        enableButtons();
        //TO DO: also reset TMtree

        //
        //Global TM
        //
        //load States
        let globalStates = loadStates(lines)
        for(let j = 0; j<globalStates.length; j++){
            turingMachine.states.add(globalStates[j]);
            //TO DO: handle setting turingMachine.startstate etc..
        }
        console.log(turingMachine.states);
        lineId += 2;

        //load Transitions
        let globalTransitions = loadTransitions(lines);
        for(let j = 0; j<globalTransitions.length; j++){
            let currTransition = globalTransitions[j];
            turingMachine.createTransition(turingMachine.getStatebyId(currTransition[0]), currTransition[1],
                turingMachine.getStatebyId(currTransition[2]), currTransition[3], currTransition[4]);
        }
        console.log(turingMachine.delta);

        //
        //Local TMs & Tree buildup
        //
        lineId += 2;
        let tree;
        let root;
        //do until no more local TMs
        while(lines[lineId] !== "" && lines[lineId] !== undefined){

            let treeNodeId = parseInt(lines[lineId]);
            lineId++;
            let parentId = parseInt(lines[lineId]);
            let parent = null;
            console.log(treeNodeId, " | ", parentId);

            lineId+=3;

            //states
            let localStates = loadStates(lines);
            let localTM = new TuringMachine(localStates, new Set(), new Set(), new Map(), undefined, undefined, undefined, null, 0);
            lineId+=2;

            //transitions
            let localTransitions = loadTransitions(lines);
            for(let j = 0; j<localTransitions.length; j++){
                let currTransition = localTransitions[j];
                localTM.createTransition(localTM.getStatebyId(currTransition[0]), currTransition[1],
                    localTM.getStatebyId(currTransition[2]), currTransition[3], currTransition[4]);
            }
            lineId+=2;
            console.log("--||", lines[lineId], lines[lineId+1], lines[lineId+2], lines[lineId+3])
            console.log(localTM);

            //node Positions
            let nodePositions = loadPosMap(lines);
            console.log(nodePositions);
            lineId+=2;

            ////Add to tree
            if(parentId === -1){
                //root: start buildup tree (base case)
                root = new TreeNode(localTM, nodePositions, null, treeNodeId)
                tree = new Tree(root);
            }
            else{
                //not root: add to Tree at correct location
                parent = root.getTreeNodeById(parentId);
                if(parent == null){
                    console.error("parent not found!");
                }
                let newNode = new TreeNode(localTM, nodePositions, parent, treeNodeId)
                parent.children.push(newNode);
                newNode.parent = parent;
            }
        }
        //currTreeNode = tree.root;
        setCurrTreeNode(tree.root);
        setTmTree(tree);
        //build little tree showing global structure
        cyTreeCreate();
        //build root window
        createCytoWindow();


/*
        //update nodeId variable (!TO DO)
        nodePresetHelper();

        //
        //load Tape
        //
        const tapeString = lines[i];
        console.log("Tape: ",tapeString);
        if(tapeString !== "" && tapeString !== undefined){
            //convert to string[]
            const tape = tapeString.split(",");
            //add to TM object
            turingMachine.tape = tape;
            //cyto
            cyWriteOnTape(tapeString.replace(/,/g, ''));
            i++;
        }
        else{
            //reset tape to empty
            cyWriteOnTape("");
        }
        moveNodesIntoWindow();
            //grabify nodes if in edit mode
        cyGrabifyNodes();
        console.log(turingMachine);
*/
    }

}


/**
 * Helper: reads state input until empty line reached 
 * 
 * @param {[string]} lines - input lines
 * @returns {[State]} list of states read from input
 */
function loadStates(lines){
    let stateList = []
    while(true){
        const currentLine = lines[lineId];
        //check if at finish
        if(currentLine == "" || currentLine == undefined){
            return stateList;
        }
        //load line
        try{
            const parsedData = JSON.parse(currentLine);
            const id = parsedData.id;
            const name = parsedData.name;
            const isStarting = parsedData.isStarting;
            const isAccepting = parsedData.isAccepting;
            const isRejecting = parsedData.isRejecting;
            stateList.push(new State(id, name, isStarting, isAccepting, isRejecting));
            
        } catch(error){
            console.log('Error parsing JSON:', error.message);
            alert(`Failed to load .json file, line: ${lineId} function: loadStates`);
            location.reload();
            return;
        }
        lineId+=1;
    }
}

/**
 * Helper: reads transition input until empty line reached 
 * 
 * @param {[string]} lines - input lines
 * @returns {[[fromStateId, readChar, toStateId, writeChar, move]]} list of transitions read from input
 */
function loadTransitions(lines){
    let transitionList = [];
    while(true){
        const currentLine = lines[lineId];
        if(currentLine == "" || currentLine == undefined){
            return transitionList;
        }
        //load line
        try{
            //get properties
            var edgeProperties = currentLine.split(',');
            const fromStateId = edgeProperties[0];
            const readChar = edgeProperties[5];
            const toStateId = edgeProperties[6];
            const writeChar = edgeProperties[11];
            const move = edgeProperties[12];
            //add to return
            let transition = [fromStateId, readChar, toStateId, writeChar, move];
            transitionList.push(transition);
        }
        catch(error){
            console.log('Error parsing JSON:', error.message);
            alert(`Failed to load .json file, line: ${lineId} function: loadTransitions`);
            location.reload();
            return;
        }
        lineId++;
    }
}

function loadPosMap(lines){
    let nodePosMap = new Map();
    while(true){
        const currentLine = lines[lineId];
        if(currentLine == "" || currentLine == undefined){
            return nodePosMap;
        }
        //load line
        try{
            //get properties
            var positionEntry = currentLine.split(',');
            const nodeId = parseInt(positionEntry[0]);
            const xPos = parseInt(positionEntry[1]);
            const yPos = parseInt(positionEntry[2]);
            //add to return
            nodePosMap.set(nodeId, [xPos, yPos]);
        }
        catch(error){
            console.log('Error parsing JSON:', error.message);
            alert(`Failed to load .json file, line: ${lineId} function: loadPosMap`);
            location.reload();
            return;
        }
        lineId++;
    }
}