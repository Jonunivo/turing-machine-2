/*
  Author: Mauro Vogel
  Date: January 2024
  
  Description: 
    - Saves Turing machine build into .json file
    - Loads Turing machine build into Simulator from .json file

  Dependencies/Imports:
    - Cytoscape.js     | function to control main Cytoscape canvas
    - CytoscapeTape.js | function to write on Tape
    - State.js         | State class
    - TuringMachine.js | TuringMachine class & global TM object
    - SuperState.js    | buildup tmTree & cytoscape main window from nodePosMap
    - Tree.js          | Tree & TreeNode class
    - userInput.js     | functions to maintain state id invariant
    - Simulation.js    | Reset simulation
    - CytoscapeTree.js | Reset & creates visual Tree representation

  Exports:
    - loadFile function 

  Invariant to keep up:
    - Every state in a TM has a unique ID. Each Cytoscape node representing this state has the same ID.
*/

import { cyClearCanvas, generateNodePosMap, moveNodesIntoWindow, cyGrabifyNodes } from "./Cytoscape.js";
import { cyWriteOnTape, tmTapetoCyto } from "./CytoscapeTape.js";
import { State } from "./State.js";
import { TuringMachine, turingMachine, resetGlobalTuringMachine } from "./TuringMachine.js"
import { tmTree, setTmTree, currTreeNode, setCurrTreeNode, createCytoWindow, resetTree} from "./SuperStates.js";
import { Tree, TreeNode } from "../datastructures/Tree.js";
import {nodePresetHelper, nodePresetReset} from "./UserInput.js";
import {simulationReset, enableButtons} from "./Simulation.js";
import { cyTreeCreate, cyTreeReset } from "./CytoscapeTree.js";

export {loadFile};


//global Variables
//Array of TM properties to be saved (used across 2 functions)
let tmProperties = []
//Line of Read Cursor
let lineId = 0;

//////////////////////////////////////////////////////////////
//// --------------------- Saving ----------------------- ////
//////////////////////////////////////////////////////////////
/**
 * Saving works as follows:
 * User presses SaveButton -> 
 * saveTuringMachine() 
 * -> Modal open -> User makes Modal input
 * (1) User presses Save in Modal -> saveFile() & close Modal
 * (2) User presses Cancel -> close Modal
 */

/**
 * Puts States & Transitions of TM into tmProperties array & opens SaveModal
 * called when user presses "Save TM"
 */
function saveTuringMachine(){
    //Open Save File Modal
    document.getElementById("saveModal").style.display = "block";
    //focus on name field
    document.getElementById("filenameInput").focus()

    //update Node Positions of current window
    currTreeNode.nodePositions = generateNodePosMap();

    tmProperties = [];
    //// Global TM
    //states
    for(const state of turingMachine.states){
        tmProperties.push(JSON.stringify(state));
    }
    tmProperties.push('\n');

    //transitions
    for(const [key, value] of turingMachine.delta){
        //format: [fromState{properties(5)}, readChar, toState{properties(5)}, writeChar, move]
        tmProperties.push([key[0].id, key[0].name, key[0].isStarting, key[0].isAccepting, key[0].isRejecting, 
            key[1], value[0].id, value[0].name, value[0].isStarting, value[0].isAccepting, value[0].isRejecting,
            value[1], value[2]]);
    }
    tmProperties.push("\n");

    ////Local TMs  
    // Process each node of tmTree (BFS)
    let nodes = [];
    nodes.push(tmTree.root);
    while(nodes.length > 0){
        //pop first element
        let currNode = nodes.shift();

        //superNodeId
        tmProperties.push(currNode.superNodeId);
        //parent superNodeId (-1 for root)
        if(currNode !== tmTree.root){
            tmProperties.push(currNode.parent.superNodeId);
        }
        else{
            tmProperties.push(-1);
        }
        tmProperties.push("\n");

        //local TuringMachine
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

        //nodePositions map
        for(const [key, value] of currNode.nodePositions){
            //[nodeId] -> [nodeXPos, nodeYPos]
            tmProperties.push([key, value[0], value[1]])
        }
        tmProperties.push("\n");

        //add all children to list
        for(let i = 0; i<currNode.children.length; i++){
            nodes.push(currNode.children[i]);
        }
    }
}
//EventListener for the Save Button
document.getElementById("saveButton").addEventListener("click", saveTuringMachine);


/**
 * Reads User Modal input & saves Tape if requested
 * Handles file creation and download.
 *
 */
function saveFile(){

    //close the modal
    document.getElementById("saveModal").style.display = "none";
    //get user input (or choose placeholder if no name provided by user)
    const filename = filenameInput.value || filenameInput.placeholder;


    if(document.getElementById("saveTape").checked){
        //also save tape content
        tmProperties.push("\n");
        tmProperties.push("\n");
        tmProperties.push(turingMachine.tape);
        //and tapePosition
        tmProperties.push(turingMachine.tapePosition);
    }
    tmProperties.push("\n");

    //convert data to string
    const tmPropString = tmProperties.join('\n');

    // Create a Blob containing the serialized data
    const blob = new Blob([tmPropString], { type: 'application/json' });

    // Create a downloadable link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    // Trigger the download
    downloadLink.click();
    // Clean up the object URL
    URL.revokeObjectURL(downloadLink.href);
}
// Event listener for the Save Confirm button in the Save Modal
document.getElementById("saveConfirm").addEventListener("click", saveFile);
// Event listener for the Cancel button in the Save Modal
document.getElementById("cancelButton3").addEventListener('click', function(){
    document.getElementById("saveModal").style.display = "none";
})


//////////////////////////////////////////////////////////////
//// -------------------- Loading ----------------------- ////
//////////////////////////////////////////////////////////////

/**
 * Handles the whole loading process from Prompting the user to submit file until creating all the
 * necessary cytoscape objects & handle turingMachine object, specifically:
 *  - Prompt User to input file
 *  - Resets TM, canvas, simulation, tape, tree
 *  - Load States & Transitions into cyto window at position specified in savefile
 *  - load Tape content (if provided)
 */

//EventListener for fileInput
document.getElementById('fileInput').addEventListener('change', (event) => {
    const fileList = event.target.files;
    if(fileList.length != 1){
        return;
    }
    //load file
    const file = fileList[0];
    const reader = new FileReader();
    reader.readAsText(file);

    loadFile(reader);
});


/**
 * Reads the content of the selected file and initiates the loading process. 
 * Resets the global Turing Machine, canvas, simulation, tape, and tree before laoding. 
 * Loads states, transitions, tape content, and builds the tree structure.
 * Invoked after the user selects a file for loading.
 *
 * @param {FileReader} reader - FileReader object containing the content of the selected file.
 */
function loadFile(reader){
     reader.onload = (event) => {
        const fileContent = event.target.result;
        //split into lines
        const lines = fileContent.split('\n');

        // Reset Turing Machine, canvas, simulation, tape, and tree
        resetGlobalTuringMachine();
        cyClearCanvas();
        nodePresetReset();
        enableButtons();
        resetTree();
        cyTreeReset();

        //reset lineId
        lineId = 0;

        //
        // Global TM
        //
        //load States
        let globalStates = loadStates(lines)
        for(const state of globalStates){
            turingMachine.states.add(state);
            //setting turingMachine.startstate etc.
            if (state.isStarting){
                turingMachine.startstate = state;
            }
            if (state.isAccepting){
                turingMachine.acceptstate = state;
            }
            else if (state.isRejecting){
                turingMachine.rejectstate.add(state);
            }
        }
        lineId += 2;

        //load Transitions
        let globalTransitions = loadTransitions(lines);
        for(let j = 0; j<globalTransitions.length; j++){
            let currTransition = globalTransitions[j];
            turingMachine.createTransition(turingMachine.getStateById(currTransition[0]), currTransition[1],
                turingMachine.getStateById(currTransition[2]), currTransition[3], currTransition[4]);
        }
        //initialize TM tape to all empty strings
        turingMachine.tape = Array.from({ length: 41 }, () => "");

        lineId += 2;

        //
        //Local TMs & Tree buildup
        //
        let tree;
        let root;
        //do until no more local TMs
        while(lines[lineId] !== "" && lines[lineId] !== undefined){
            //read treeNodeId & parentId
            let treeNodeId = parseInt(lines[lineId]);
            lineId++;
            let parentId = parseInt(lines[lineId]);
            let parent = null;

            lineId+=3;

            //states
            let localStates = loadStates(lines);
            let localTM = new TuringMachine(localStates, new Set(), new Set(), new Map(), undefined, undefined, new Set(), null, 0);
            lineId+=2;
            //set starting/accepting/rejecting state of localTM
            for(const state of localStates){
                if(state.isStarting){
                    localTM.startstate = state;
                }
                if(state.isAccepting){
                    localTM.acceptstate = state;
                }
                else if(state.isRejecting){
                    localTM.rejectstate.add(state);
                }
            }

            //transitions
            let localTransitions = loadTransitions(lines);
            for(let j = 0; j<localTransitions.length; j++){
                let currTransition = localTransitions[j];
                localTM.createTransition(localTM.getStateById(currTransition[0]), currTransition[1],
                    localTM.getStateById(currTransition[2]), currTransition[3], currTransition[4]);
            }
            lineId+=2;

            //read node Positions
            let nodePositions = loadPosMap(lines);
            lineId+=2;

            //Create TreeNode & add to Tree
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

        //
        //load Tape
        //
        lineId+=4;
        const tapeString = lines[lineId];
        if(tapeString !== "" && tapeString !== undefined){
            //convert to string[]
            const tape = tapeString.split(",");
            //add to TM object
            turingMachine.tape = tape;
            //write content onto tape
            lineId++;
            turingMachine.tapePosition = parseInt(lines[lineId]);
            tmTapetoCyto();
            //cyWriteOnTape(tapeString.replace(/,/g, ''));
            lineId++;
        }
        else{
            //reset tape to empty
            cyWriteOnTape("");
        }

        moveNodesIntoWindow();

        //currTreeNode = tree.root;
        setCurrTreeNode(tree.root);
        setTmTree(tree);
        //build cyTree showing global structure
        cyTreeCreate(true);
        //build root window
        createCytoWindow();
        cyGrabifyNodes();
        //reset simulation
        simulationReset();
    }
}


/**
 * Helper: reads state input until empty line reached 
 * 
 * @param {[string]} lines - input lines
 * @returns {[State]} list of states read from input
 * @throws {Error} Throws an error if there is an issue parsing the input
 */
function loadStates(lines){
    let stateSet = new Set();
    while(true){
        const currentLine = lines[lineId];
        //check if at finish
        if(currentLine == "" || currentLine == undefined){
            return stateSet;
        }
        //load line
        try{
            const parsedData = JSON.parse(currentLine);
            const id = parsedData.id;
            const name = parsedData.name;
            const isStarting = parsedData.isStarting;
            const isAccepting = parsedData.isAccepting;
            const isRejecting = parsedData.isRejecting;
            //adjust nodeId (such that it is ready after loading TM)
            nodePresetHelper();
            //create & add state to stateSet
            stateSet.add(new State(id, name, isStarting, isAccepting, isRejecting));
            
        } catch(error){
            console.error('Error parsing JSON:', error.message);
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
 * @throws {Error} Throws an error if there is an issue parsing the input
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
            console.error('Error parsing JSON:', error.message);
            alert(`Failed to load .json file, line: ${lineId} function: loadTransitions`);
            location.reload();
            return;
        }
        lineId++;
    }
}

/**
 * Reads lines containing node position data and creates a nodePosMap.
 * Continues reading lines until an empty line or the end of the input is reached.
 *
 * @param {string[]} lines - Array of lines containing node position data.
 * @returns {Map<number, [number, number]>} - A mapping of node IDs to their respective positions (x, y).
 * @throws {Error} - Throws an error if there is an issue parsing the input.
 */
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
            //add to the return map
            nodePosMap.set(nodeId, [xPos, yPos]);
        }
        catch(error){
            console.error('Error parsing JSON:', error.message);
            alert(`Failed to load .json file, line: ${lineId} function: loadPosMap`);
            location.reload();
            return;
        }
        lineId++;
    }
}