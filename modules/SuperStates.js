import { Tree, TreeNode } from "../datastructures/Tree.js";
import { TuringMachine, turingMachine} from "./TuringMachine.js";
import { State } from "./State.js";

import { cy, cyClearCanvas, cyCreateEdge, cyCreateNode, cyGrabifyNodes, generateNodePosMap, addEventListenerWithCheck } from "./Cytoscape.js";
import { nodePresetHelper, inEditMode } from "./UserInput.js";
import { cytoEditNode, editNode } from "./UserEdit.js";
import { cyTreeCreate, cyTreeStyleCurrentNode } from "./CytoscapeTree.js";

export{currTreeNodeName, currTreeNode, tmTree, resetTree, setTmTree, setCurrTreeNode, editNodeLocalTM, getLocalTM, getRootTM, getAcceptSubTM, getStartSubTM,  userEditSuperNodeHandler, createCytoWindow};

//Global Variables

//current TreeNode (initialized to empty TM = local TM of root)
var currTreeNode = new TreeNode(new TuringMachine(new Set(), new Set(), new Set(), new Map(), undefined, undefined, new Set(), null, 0));
currTreeNode.superNodeId = 0;
//currTreeNodeName
var currTreeNodeName;

// Tree of TMs
var tmTree = new Tree(currTreeNode);
//createNode Position
var position;
//imported globals
//turingMachine - global TM object
//cy            - cytoscape object
//cytoEditNode  - cyto node currently being edited
//editNode      - node currently being edited

function resetTree(){
    tmTree = new Tree(currTreeNode);
    currTreeNode = new TreeNode(new TuringMachine(new Set(), new Set(), new Set(), new Map(), undefined, undefined, new Set(), null, 0));
    currTreeNode.superNodeId = 0;
}


//!should be called before entering new window!
function addTuringmaschine(turingMachine, positionMap = new Map(), superNodeId){
    //add new TM to tree
    let newNode = new TreeNode(turingMachine, positionMap, currTreeNode, superNodeId)
    currTreeNode.children.push(newNode);
    newNode.parent = currTreeNode;



}

//////////////////////////////////////////////////////////////
//// ------------------ User Creation ------------------- ////
//////////////////////////////////////////////////////////////

//rightclick on canvas: create superState
cy.on('cxttap', (event) => {
    //only allow in editMode (& click on canvas)
    if(inEditMode() && event.target === cy){
        position = event.position;

        //Modal Element
        const superNodeModal = document.getElementById('superNodeModal');
        
        //get cytoscape window position
        const cytoWindow = document.querySelector('#cytoscape');
        const leftValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('left'), 10);
        const topValue = parseInt(window.getComputedStyle(cytoWindow).getPropertyValue('top'), 10);
        //display modal at doubleclick position
        superNodeModal.style.paddingLeft = `${position.x + leftValue}px`
        let maxPaddingTop = Math.min(position.y + topValue, window.innerHeight-350);
        superNodeModal.style.paddingTop = `${maxPaddingTop}px`;
        superNodeModal.style.display = 'block';

        ////change button from "edit node" to "create node"
        var superNodeEditButton = document.getElementById("superNodeEditButton");
        var superNodeButton = document.createElement("button");
        superNodeButton.id = "superNodeButton";
        superNodeButton.innerText = "Zustand erstellen";
        if(superNodeEditButton){
            // Replace the existing button with the new button
            superNodeEditButton.parentNode.replaceChild(superNodeButton, superNodeEditButton);
        }

        //Event Listener
        addEventListenerWithCheck(document.getElementById('superNodeButton'), 'click', userSuperNodeInputHandler)


    }
});

function userSuperNodeInputHandler(){
    //Close the modal
    superNodeModal.style.display = 'none';
    //Read user input
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
    
    //create cyto node
    let superStateId = nodePresetHelper();
    cyCreateNode(superStateId, stateName, position.x, position.y, false, false, false, true);

    //save node positions
    currTreeNode.nodePositions = generateNodePosMap();

    //// Create SubTM & add to TreeStructure (child)
    //Create Start & End Node
    let id1 = nodePresetHelper();
    let id2 = nodePresetHelper();
    let startState = new State(id1, "start", true, false, false);
    let endState = new State(id2, "end", false, true, false);
    //Add default transition between start & end node
    let delta = new Map();
    delta.set([startState, "else"], [endState, "nothing", "N"]);
    //tape (from parent)
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
    //create visible Tree
    cyTreeCreate(false);

    //merge into main TM (adds start & stop state to globalTM)
        //remove isStarting & isAccepting for global TM
    subTuringMachine.getStatebyId(id1).isStarting = false;
    subTuringMachine.getStatebyId(id2).isAccepting = false;
    turingMachine.mergeInTuringMachine(subTuringMachine);
    subTuringMachine.getStatebyId(id1).isStarting = true;
    subTuringMachine.getStatebyId(id2).isAccepting = true;

    //add SuperState to local TM (parent)
    let superState = new State(superStateId, stateName)
    currTreeNode.turingMachine.states.add(superState);



    //increase ID
    nodePresetHelper();

    cyGrabifyNodes();

}   

/**
 * Handles User editing supernode (called by user clicking "edit node" within supernode modal)
 */
function userEditSuperNodeHandler(){
    //Close the modal
    superNodeModal.style.display = 'none';

    let newName = document.getElementById('superStateName').value;

    //catch name already exists in current TreeNode
    for(const state of currTreeNode.turingMachine.states){
        if(state.name === stateName){
            alert(`state with Name ${state.name} already exists, please choose a unique name`);
            superNodeModal.style.display = 'block';
            return;
        }
    }

    //get edit node

    //cyto
    cytoEditNode.style('label', newName);
    cytoEditNode.style('width', `${newName.length*10 + 10}px`)

    //global TM object
    //no change, since node not in global TM

    //local TM object
    editNode.name = newName;
    console.log("states ", currTreeNode.turingMachine.states);

    cyGrabifyNodes();
}

//User presses cancel button in NodeModal -> hide nodeModal
document.getElementById("cancelButton4").addEventListener('click', function(){
    superNodeModal.style.display = 'none';
})

//////////////////////////////////////////////////////////////
//// ------------------ Enter/Leave state --------------- ////
//////////////////////////////////////////////////////////////

//enter superstate
cy.on('cxttap', 'node', function(event){
    //Save old Canvas Positions
    currTreeNode.nodePositions = generateNodePosMap();

    //find parent with superStateId == target node id
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
        console.log("Right Click not on super node");
        return;
    }

    ////Create Nodes & Edges according to TM object that is being entered
    createCytoWindow();
    //show current cyTree node red
    cyTreeStyleCurrentNode(currTreeNode.superNodeId);

});

//leave superstate (to parent)
function leaveSuperState(){
    //Save old Canvas Positions
    currTreeNode.nodePositions = generateNodePosMap();

    if(currTreeNode.parent === null || currTreeNode.parent === undefined){
        //in root, cannot "leave superstate"
        return;
    }
    currTreeNode = currTreeNode.parent;

    ////Create Nodes & Edges according to TM object that is being entered
    createCytoWindow();

    cyTreeStyleCurrentNode(currTreeNode.superNodeId);
}
document.getElementById("leaveSuperState").addEventListener("click", leaveSuperState);


//Helper: creates cytowindow according to TreeNode description (currTreeNode)
function createCytoWindow(){
    //Clear Canvas
    cyClearCanvas();
    console.log("LOCAL TM: ", currTreeNode.turingMachine);
    console.log("GLOBAL TM: ", turingMachine);
    console.log(currTreeNode);

    //get Ids of SuperNodes
    let superNodeIds = new Set();
    for(let child of currTreeNode.children){
        superNodeIds.add(child.superNodeId)
    }

    //Create Nodes
    for(let state of currTreeNode.turingMachine.states){
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
    //Create Edges
    for(let [key, value] of currTreeNode.turingMachine.delta){
        console.log(key, " ", value);
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
//// ---------------- Create/Edit Local TM -------------- ////
//////////////////////////////////////////////////////////////

//adjust local TM when node edit (borrow from global tm)
function editNodeLocalTM(editNode, rejectAdded, rejectDeleted){
    //find state in local TM with corresponding id
    let editNodeLocal = currTreeNode.turingMachine.getStatebyId(editNode.id);

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
//// ---------------- Getters -------------- ////
//////////////////////////////////////////////////////////////

function getLocalTM(){
    return currTreeNode.turingMachine;
}

function getRootTM(){
    return tmTree.root.turingMachine;
}

function getStartSubTM(superstateId){
    //find requested node in local TM & get childTM
    let childrenArr = currTreeNode.children
    let childTreeNode;
    let found = false;

    for(let i = 0; i<childrenArr.length; i++){
        console.log("check ",childrenArr[i].superNodeId," | ", parseInt(superstateId))
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
//// ---------------- Setters -------------- ////
//////////////////////////////////////////////////////////////
function setTmTree(tree){
    tmTree = tree;
}

function setCurrTreeNode(node){
    currTreeNode = node;
}