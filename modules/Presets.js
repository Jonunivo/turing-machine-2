import { cyCreateNode, cyCreateEdge, cyClearCanvas } from "./Cytoscape.js";
import { cyTapeClear } from "./CytoscapeTape.js";
import { turingMachine } from "./TuringMachine.js";
import { nodePresetHelper, nodePresetReset } from "./UserInput.js";

function empty(){
    turingMachine.createTuringMachineBasic();
    nodePresetReset();
    cyClearCanvas();
    cyTapeClear();
}

function loadPresetOne(){
    console.log("load preset 1 clicked");
    //reset
    empty();
    //Create States
    //right state
    cyCreateNode(0, 'right', undefined, undefined, true, false, false)
    turingMachine.createState(0, 'right', true, false, false);
    
    //carry state
    cyCreateNode(nodePresetHelper(),'carry', undefined, undefined, false, false, false)
    turingMachine.createState(1, 'carry', false, false, false);

    //done state
    cyCreateNode(nodePresetHelper(),'done', undefined, undefined, false, true, false)
    turingMachine.createState(2, 'done', false, true, false);

    nodePresetHelper();

    //Create Transitions
    //// from right
    //0->0 & move left when reading 0
    let cyLabel = "R: " + '0' + " | " + "R";
    cyCreateEdge(0, 0, cyLabel, '0');
    turingMachine.createTransition(turingMachine.getStatebyId(0), '0', turingMachine.getStatebyId(0), '', 'R')
    //0->0 & move left when reading 1
    cyLabel = "R: " + '1' + " | " + "R";
    cyCreateEdge(0, 0, cyLabel, '1');
    turingMachine.createTransition(turingMachine.getStatebyId(0), '1', turingMachine.getStatebyId(0), '', 'R')
    //0->1 & move right when reading ""
    cyLabel = "R: " + '' + " | " + "L";
    cyCreateEdge(0, 1, cyLabel, '');
    turingMachine.createTransition(turingMachine.getStatebyId(0), '', turingMachine.getStatebyId(1), '', 'L')
    
    ////from carry
    //1 -> 0, R
    cyLabel = "R: " + '1' + " W: " + '0' + " | " + "L";
    cyCreateEdge(1, 1, cyLabel, '1');
    turingMachine.createTransition(turingMachine.getStatebyId(1), '1', turingMachine.getStatebyId(1), '0', 'L')
    //0 -> 1, L
    cyLabel = "R: " + '0' + " W: " + '1' + " | " + "R";
    cyCreateEdge(1, 2, cyLabel, '0');
    turingMachine.createTransition(turingMachine.getStatebyId(1), '0', turingMachine.getStatebyId(2), '1', 'R')
    //"" -> 1, L
    cyLabel = "R: " + '' + " W: " + '1' + " | " + "R";
    cyCreateEdge(1, 2, cyLabel, '');
    turingMachine.createTransition(turingMachine.getStatebyId(1), '', turingMachine.getStatebyId(2), '1', 'R')

}


//handle Dropdown menu & activate correct function when value changes
var presetSelect = document.getElementById("presetSelect");
    
presetSelect.addEventListener("change", function() {
        if (presetSelect.value === "empty") {
            empty()
            console.log("empty clicked");
        }
        else if (presetSelect.value === "PresetOne") {
            loadPresetOne();
            console.log("PresetOne clicked");
        } 
        // Add more conditions for other options as needed
    });

