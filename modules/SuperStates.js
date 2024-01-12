/*
  Author: Mauro Vogel
  Date: January 2024
  
  Description: 
    - in general handles everything related to super states & structure of sub turingmachines.
    - Create Tree of TreeNodes saving structure of Sub turingmachines
    - Function to let user create, edit & delte super states
    - Functions to Enter & Leave sub Turingmachines & build cytoscape window doing it
    - Provide getters & setters to other modules wanting to access Tree structure or parts of TreeNodes

  Dependencies/Imports:
    - Tree.js          | Tree & TreeNode class to create Tree & TreeNodes
    - TuringMachine.js | global variable global turingMachine & TuringMachine class
    - State.js         | State class
    - Cytoscape.js     | Controls to manipulate Cytoscape window (buildup window when switching between TreeNodes)
    - UserInput.js     | uphold id invariant & detect if in editmode
    - UserEdit.js      | global variables editNode & cytoEditNode, used for editing & deleting super states
    - CytoscapeTree.js | functions to control Tree Representation in cyTree window

  Exports:
    - the global variables tmTree, currTreeNode & currTreeNodeName
*/


import { Tree, TreeNode } from "../datastructures/Tree.js";
import { TuringMachine, turingMachine} from "./TuringMachine.js";
import { State } from "./State.js";
import { cy, cyClearCanvas, cyCreateEdge, cyCreateNode, cyGrabifyNodes, generateNodePosMap, addEventListenerWithCheck } from "./Cytoscape.js";
import { nodePresetHelper, inEditMode } from "./UserInput.js";
import { cytoEditNode, editNode } from "./UserEdit.js";
import { cyTreeCreate, cyTreeReset, cyTreeStyleCurrentNode } from "./CytoscapeTree.js";

export{currTreeNodeName, currTreeNode, tmTree, resetTree, setTmTree, setCurrTreeNode, editNodeLocalTM, getLocalTM, getRootTM, getAcceptSubTM, getStartSubTM,  userEditSuperNodeHandler, createCytoWindow, userDeleteSuperNodeHandler};

//Global Variables
//current TreeNode (initialized to empty TM = local TM of root)
var currTreeNode = new TreeNode(new TuringMachine(new Set(), new Set(), new Set(), new Map(), undefined, undefined, new Set(), null, 0));
currTreeNode.superNodeId = 0;
//used to save user chosen name of super state across multiple functions
var currTreeNodeName;

// create Tree of TMs
var tmTree = new Tree(currTreeNode);
// position super state is created (saved across multiple functions)
var position;
//imported globals
//turingMachine - global TM object
//cy            - cytoscape object
//cytoEditNode  - cyto node currently being edited
//editNode      - node currently being edited


//////////////////////////////////////////////////////////////
//// --------------------- Helpers ---------------------- ////
//////////////////////////////////////////////////////////////
/**
 * Resets the tree structure. Creates a new root tree node and resets currTreeNode
 * to a new TreeNode with an empty TuringMachine.
 */
function resetTree(){
    tmTree = new Tree(currTreeNode);
    currTreeNode = new TreeNode(new TuringMachine(new Set(), new Set(), new Set(), new Map(), undefined, undefined, new Set(), null, 0));
    currTreeNode.superNodeId = 0;
}

/**
 * Adds a new Turing machine to the tree structure.
 * 
 * @param {TuringMachine} turingMachine - The Turing machine to be added to the tree.
 * @param {Map} positionMap - The position map for nodes in the new Turing machine.
 * @param {number} superNodeId - The super node ID to link the new Turing machine to the tree.
 */
function addTuringmaschine(turingMachine, positionMap = new Map(), superNodeId){
    //add new TM to tree
    let newNode = new TreeNode(turingMachine, positionMap, currTreeNode, superNodeId)
    currTreeNode.children.push(newNode);
    newNode.parent = currTreeNode;
}

//////////////////////////////////////////////////////////////
//// ------------------ User Creation ------------------- ////
//////////////////////////////////////////////////////////////

/**
 * Handles right-click on the canvas to create a super state.
 * It prepares & displays a modal to create a super state
 * 
 * @param {Event} event - The context menu event.
 * 
 */
cy.on('cxttap', (event) => {
    //only allow in editMode (& click on canvas)
    if(inEditMode() && event.target === cy){
        position = event.position;

        //// Prepare Modal Element
        const superNodeModal = document.getElementById('superNodeModal');
        
        //get cytoscape window position
        const cytoWindow = document.querySelector('#cytoscape');
        const leftValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('left'), 10);
        const topValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('top'), 10);
        //display modal at click position
        superNodeModal.style.paddingLeft = `${position.x + leftValue}px`
        let maxPaddingTop = Math.min(position.y + topValue, window.innerHeight-350);
        superNodeModal.style.paddingTop = `${maxPaddingTop}px`;
        superNodeModal.style.display = 'block';

        ////change button from "edit node" to "create node"
        var superNodeEditButton = document.getElementById("superNodeEditButton");
        var superNodeButton = document.createElement("button");
        superNodeButton.id = "superNodeButton";
        superNodeButton.innerText = "Create State";
        superNodeButton.className = "green-button";
        if(superNodeEditButton){
            // Replace the existing button with the new button
            superNodeEditButton.parentNode.replaceChild(superNodeButton, superNodeEditButton);
        }
        //remove delete node button (if exists)
        let deleteButton = document.getElementById("superNodeDeleteButton");
        if(deleteButton){
            document.getElementById("deleteSuperNodeDiv").removeChild(deleteButton);
        }

        //Event Listener for Confirming creation
        addEventListenerWithCheck(document.getElementById('superNodeButton'), 'click', userSuperNodeInputHandler)
    }
});

/**
 * Handles user input for creating a super state.
 * Called by the user pressing "Create TM as state" button
 * Reads user input, creates super state
 * creates local subTuringmachine & adds it to the tree structure
 * creates default states and transition in subTuringmachine (local starting & accepting states)
 * 
 * This function is called when the user clicks the "Create State" button in the super state modal.
 */
function userSuperNodeInputHandler(){
    //Close the modal
    superNodeModal.style.display = 'none';
    ////Read user input
    //state Name
    let stateName = document.getElementById('superStateName').value;
    //catch name already exists in current TreeNode
    for(const state of currTreeNode.turingMachine.states){
        if(state.name === stateName){
            alert(`state with Name ${state.name} already exists, please choose a unique name`);
            superNodeModal.style.display = 'block';
            return;
        }
    }
    currTreeNodeName = stateName;
    
    ////create cyto node & uphold id invariant
    let superStateId = nodePresetHelper();
    cyCreateNode(superStateId, stateName, position.x, position.y, false, false, false, true);

    //save node positions
    currTreeNode.nodePositions = generateNodePosMap();

    //// Create SubTM & add to TreeStructure (child)
    //Create default Start & Accept Node
    let id1 = nodePresetHelper();
    let id2 = nodePresetHelper();
    let startState = new State(id1, "start", true, false, false);
    let endState = new State(id2, "end", false, true, false);
    //Add default transition between start & end node
    let delta = new Map();
    delta.set([startState, "else"], [endState, "nothing", "N"]);
    //tape (from parent) (unused in local TMs but added for completeness anyways)
    let tape = currTreeNode.turingMachine.tape;
    let tapePosition = currTreeNode.turingMachine.tapePosition;
    //Create TM Object 
    let subTuringMachine = new TuringMachine(new Set(), new Set(), new Set(), delta, startState, endState, new Set(), tape, tapePosition);
    subTuringMachine.states.add(startState);
    subTuringMachine.states.add(endState);

    //add TM Object to tree 
    //add positionmap (default)
    let positionMap = new Map();
    //set position of start & end state of subTM
    positionMap.set(id1, [100, 200])
    positionMap.set(id2, [500, 200])
    //add TM to tree
    addTuringmaschine(subTuringMachine, positionMap, superStateId);
    //create visible cyTree structure
    cyTreeCreate(false);

    //merge local into global TM (adds start & stop state to globalTM)
    //remove isStarting & isAccepting for local TM to not also add the to global TM
    subTuringMachine.getStateById(id1).isStarting = false;
    subTuringMachine.getStateById(id2).isAccepting = false;
    turingMachine.mergeInTuringMachine(subTuringMachine);
    //readd previously removed isStarting & isAccepting for global TM
    subTuringMachine.getStateById(id1).isStarting = true;
    subTuringMachine.getStateById(id2).isAccepting = true;

    ////add SuperState to local TM (parent)
    let superState = new State(superStateId, stateName)
    currTreeNode.turingMachine.states.add(superState);

    //increase ID to uphold id invariant
    nodePresetHelper();

    cyGrabifyNodes();

}   

/**
 * Handles User editing supernode (called by user clicking "edit node" within supernode modal)
 */
function userEditSuperNodeHandler(){
    //Close the modal
    superNodeModal.style.display = 'none';

    ////Read user input
    let newName = document.getElementById('superStateName').value;
    //catch name already exists in current TreeNode
    for(const state of currTreeNode.turingMachine.states){
        if(state.name === stateName){
            alert(`state with Name ${state.name} already exists, please choose a unique name`);
            superNodeModal.style.display = 'block';
            return;
        }
    }

    ////edit nodes
    //cyto main window
    cytoEditNode.style('label', newName);
    cytoEditNode.style('width', `${newName.length*10 + 10}px`)
    cyGrabifyNodes();
    //global TM object
    //no change, since node not in global TM
    //local TM object
    editNode.name = newName;

    //update cytoTree window
    cyTreeReset();
    cyTreeCreate(true);
}

/**
 * Handles User editing supernode (called by user clicking "delete node" within supernode modal)
 * note:    lazy solution: leaves local root unused in background & global TM still contains nodes & edges (they are not connected however)
 *          limited solution: deletion only possible for empty super nodes with nod connected edges
 */
function userDeleteSuperNodeHandler(){
    superNodeModal.style.display = 'none';
    ////check if any edges from/to this node
    let stateToDelete = getLocalTM().getStateById(editNode.id);
    for(const [key, value] of currTreeNode.turingMachine.delta){
        if(key[0] === stateToDelete ||
            value[0] === stateToDelete){
            alert(`please remove any transition from/to this state first`)
            return;
        }
    }
    
    ////check if subTM only consists of start & end state ("empty" subTM)
    //get subnode current tm:
    let currTM = getSubNode(editNode.id).turingMachine
    if(currTM.states.size === 2 && currTM.delta.size === 1){
        //remove node: !lazy solution leaves local root unused in background
        //& global TM still contains nodes & edges (they are not connected however)
        
        //remove SubTM node from local TM
        let localState = getLocalTM().getStateById(editNode.id);
        getLocalTM().states.delete(localState);
        //remove from cytoscape window
        cy.remove(cytoEditNode);

        //remove child from tree & rebuild visual tree 
        let indexOfChild = currTreeNode.children.indexOf(getSubNode(editNode.id))
        currTreeNode.children.splice(indexOfChild, 1);
        //rebuild cyTree
        cyTreeReset();
        cyTreeCreate(true);
        cyTreeStyleCurrentNode(currTreeNode.superNodeId);
    }
    else{
        alert("removing SubTM nodes is currently only possible if their content is empty (only contains the default states and transitions)");
    }
}

//EventListener for User presses cancel button in SuperNodeModal -> hide superNodeModal
document.getElementById("cancelButton4").addEventListener('click', function(){
    superNodeModal.style.display = 'none';
})

//////////////////////////////////////////////////////////////
//// ------------------ Enter/Leave state --------------- ////
//////////////////////////////////////////////////////////////

/**
 * Handles the event when a user enters a super state by right-clicking on a node.
 * 
 * @param {Object} event - The Cytoscape event object.
 * 
 * @returns {void}
 * 
 * It saves the old canvas positions, creates nodes and edges according to the Turing Machine object that is being entered.
 * Additionally, it updates the CyTree styles to highlight the current node.
 */
cy.on('cxttap', 'node', function(event){
    //Save old Canvas Positions
    currTreeNode.nodePositions = generateNodePosMap();

    //find child being enetered
    let childrenArr = currTreeNode.children
    let found = false;
    for(let i = 0; i<childrenArr.length; i++){
        if(childrenArr[i].superNodeId === parseInt(event.target.id())){
            currTreeNode = childrenArr[i];
            found = true;
        }
    }
    if(!found){
        //Node is Not a Super Node, ignore rightclick
        return;
    }

    ////Create Nodes & Edges according to TM object that is being entered
    createCytoWindow();
    //highlightcurrent cyTree node blue
    cyTreeStyleCurrentNode(currTreeNode.superNodeId);

});

/**
 * Handles the event when a user leaves a super state.
 * is called by user pressing "Leave Sub" button
 * 
*/
function leaveSuperState(){
    //Save old Canvas Positions
    currTreeNode.nodePositions = generateNodePosMap();

    //go to parent
    if(currTreeNode.parent === null || currTreeNode.parent === undefined){
        //in root, cannot "leave superstate"
        return;
    }
    currTreeNode = currTreeNode.parent;

    ////Create Nodes & Edges according to TM object that is being entered
    createCytoWindow();
    //highlight current cyTree node blue
    cyTreeStyleCurrentNode(currTreeNode.superNodeId);
}
//EventListener for button "Leave Sub"
document.getElementById("leaveSuperState").addEventListener("click", leaveSuperState);


/**
 * Helper function that creates the main CytoWindow according to the TreeNode description (currTreeNode).
 * Clears the canvas, creates nodes, and edges based on the current local Turing Machine object.
 *
 * @returns {void}
 * 
 */
function createCytoWindow(){
    //Clear Canvas
    cyClearCanvas();

    //get Ids of SuperNodes
    let superNodeIds = new Set();
    for(let child of currTreeNode.children){
        superNodeIds.add(child.superNodeId)
    }

    //Create Cytoscape Nodes
    for(let state of currTreeNode.turingMachine.states){
        //get node positions from nodePositions map
        let nodePositionX = currTreeNode.nodePositions.get(parseInt(state.id))[0];
        let nodePositionY = currTreeNode.nodePositions.get(state.id)[1];
        //cyto create node
        if(superNodeIds.has(state.id)){
            //superNode
            cyCreateNode(state.id, state.name, nodePositionX, nodePositionY, state.isStarting, state.isAccepting, state.isRejecting, true);
        }
        else{
            //not a superNode
            cyCreateNode(state.id, state.name, nodePositionX, nodePositionY, state.isStarting, state.isAccepting, state.isRejecting);
        }
    }
    //Create Cytoscape Edges
    for(let [key, value] of currTreeNode.turingMachine.delta){
        let fromNode = key[0].id;
        let toNode = value[0].id;
        //determine label
        let cyLabel = "";
        let labelMove = "⯀";
        if(value[2] === "L"){
            labelMove = "⮜";
        }
        if(value[2] === "R"){
            labelMove = "➤"
        }
        if(value[1] !== 'nothing'){
            cyLabel = "🔍 " + key[1] + "  | ✎ " + value[1] + " | " + labelMove;
        }
        else{
            cyLabel = "🔍 " + key[1] + " | " + labelMove;
        }
        //cyto create Edge
        cyCreateEdge(fromNode, toNode, cyLabel, key[1]);
    }
    cyGrabifyNodes();
}

//////////////////////////////////////////////////////////////
//// ---------------- Helper Edit Local TM -------------- ////
//////////////////////////////////////////////////////////////

/**
 * Helper Function to edit a node in the local Turing Machine (TM) within the current tree node.
 * Copies properties such as name, starting, accepting, and rejecting status.
 *
 * @param {object} editNode - The node to be edited.
 * @param {boolean} rejectAdded - Indicates whether the node has been marked as rejecting.
 * @param {boolean} rejectDeleted - Indicates whether the node has been unmarked as rejecting.
 */
function editNodeLocalTM(editNode, rejectAdded, rejectDeleted){
    //find state in local TM with corresponding id
    let editNodeLocal = currTreeNode.turingMachine.getStateById(editNode.id);

    //copy properties
    editNodeLocal.name = editNode.name;
    editNodeLocal.isStarting = editNode.isStarting;
    editNodeLocal.isAccepting = editNode.isAccepting;
    editNodeLocal.isRejecting = editNode.isRejecting;

    if(getLocalTM() === getRootTM()){
        currTreeNode.turingMachine.startstate = turingMachine.startstate;
        currTreeNode.turingMachine.acceptstate = turingMachine.acceptstate;
    }
    //modify local rejectstate set
    if(rejectAdded){
        currTreeNode.turingMachine.rejectstate.add(editNodeLocal);
    }
    if(rejectDeleted){
        currTreeNode.turingMachine.rejectstate.delete(editNodeLocal);
    }
}

//////////////////////////////////////////////////////////////
//// ---------------- Getters --------------------------- ////
//////////////////////////////////////////////////////////////

/**
 * Function to get the local Turing Machine (TM) within the current tree node.
 *
 * @returns {object} - The local Turing Machine.
 */
function getLocalTM(){
    return currTreeNode.turingMachine;
}

/**
 * Function to get the root Turing Machine (TM) from the tree structure.
 *
 * @returns {object} - The root local Turing Machine.
 */
function getRootTM(){
    return tmTree.root.turingMachine;
}

/**
 * Function to get the sub-node (TreeNode) with the specified superstateId from the current tree node.
 *
 * @param {number} superstateId - The superstateId to find the corresponding sub-node.
 * @returns {object|null} - The sub-node with the specified superstateId, or null if not found.
 */
function getSubNode(superstateId){
    let childrenArr = currTreeNode.children
    for(let i = 0; i<childrenArr.length; i++){
        if(childrenArr[i].superNodeId === parseInt(superstateId)){
            return childrenArr[i];
        }
    }
    return null;
}

/**
 * Function to get the id of the start state in the sub-Turing Machine (TM) associated with the specified superstateId.
 *
 * @param {number} superstateId - The superstateId to find the corresponding sub-Turing Machine.
 * @returns {number|undefined} - The id of the start state in the sub-Turing Machine, or undefined if not found.
 */
function getStartSubTM(superstateId){
    //find requested node in local TM & get childTM
    let childrenArr = currTreeNode.children
    let childTreeNode;
    let found = false;

    for(let i = 0; i<childrenArr.length; i++){
        if(childrenArr[i].superNodeId === parseInt(superstateId)){
            childTreeNode = childrenArr[i];
            found = true;
            break;
        }
    }

    //return id of accept state of childTM
    if(found){
        return childTreeNode.turingMachine.startstate.id;
    }
    else{
        console.error("getStartSubTM not found");
        return undefined;
    }
}

/**
 * Function to get the id of the accept state in the sub-Turing Machine (TM) associated with the specified superstateId.
 *
 * @param {number} superstateId - The superstateId to find the corresponding sub-Turing Machine.
 * @returns {number|undefined} - The id of the accept state in the sub-Turing Machine, or undefined if not found.
 */
function getAcceptSubTM(superstateId){
    //find requested node in local TM & get childTM
    let childrenArr = currTreeNode.children
    let childTreeNode;
    let found = false;

    for(let i = 0; i<childrenArr.length; i++){
        if(childrenArr[i].superNodeId === parseInt(superstateId)){
            childTreeNode = childrenArr[i];
            found = true;
            break;
        }
    }
    //return accept state of childTM
    if(found){
        return childTreeNode.turingMachine.acceptstate.id
    }
    else{
        console.error("getAcceptSubTM not found");
        return undefined;
    }
}

//////////////////////////////////////////////////////////////
//// ---------------------- Setters --------------------- ////
//////////////////////////////////////////////////////////////

/**
 * Function to set the Turing Machine (TM) tree to the specified tree.
 *
 * @param {Tree} tree - The tree to set as the TM tree.
 */
function setTmTree(tree){
    tmTree = tree;
}

/**
 * Function to set the current tree node to the specified node.
 *
 * @param {TreeNode} node - The tree node to set as the current node.
 */
function setCurrTreeNode(node){
    currTreeNode = node;
}