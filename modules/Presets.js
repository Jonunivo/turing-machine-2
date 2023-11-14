import { cyCreateNode, cyCreateEdge, cyClearCanvas } from "./Cytoscape.js";
import { cyTapeClear } from "./CytoscapeTape.js";
import { turingMachine } from "./TuringMachine.js";
import { nodePresetHelper, nodePresetReset } from "./UserInput.js";

/**
 * Empties canvas & tape & turingMachine object,
 * called when loading preset
 */
function empty(){
    turingMachine.createTuringMachineBasic();
    nodePresetReset();
    cyClearCanvas();
    cyTapeClear();
}

/**
 * Loads Preset 1 (binary Increment)
 *  - creates&adjusts TM object
 *  - creates cyto nodes & edges
 */
function loadPresetOne(){
    //reset
    empty();
    //Create States
    //right state
    cyCreateNode(0, 'right', 200, 200, true, false, false)
    turingMachine.createState(0, 'right', true, false, false);
    
    //carry state
    cyCreateNode(nodePresetHelper(),'carry', 350, 200, false, false, false)
    turingMachine.createState(1, 'carry', false, false, false);

    //done state
    cyCreateNode(nodePresetHelper(),'done', 500, 200, false, true, false)
    turingMachine.createState(2, 'done', false, true, false);

    nodePresetHelper();

    //Create Transitions
    //// from right
    //0->0 & move left when reading 0
    let cyLabel = "🔍 " + '0' + " | " + "➤";
    cyCreateEdge(0, 0, cyLabel, '0');
    turingMachine.createTransition(turingMachine.getStatebyId(0), '0', turingMachine.getStatebyId(0), '', 'R')
    //0->0 & move left when reading 1
    cyLabel = "🔍 " + '1' + " | " + "➤";
    cyCreateEdge(0, 0, cyLabel, '1');
    turingMachine.createTransition(turingMachine.getStatebyId(0), '1', turingMachine.getStatebyId(0), '', 'R')
    //0->1 & move right when reading ""
    cyLabel = "🔍 " + '' + " | " + "⮜";
    cyCreateEdge(0, 1, cyLabel, '');
    turingMachine.createTransition(turingMachine.getStatebyId(0), '', turingMachine.getStatebyId(1), '', 'L')
    
    ////from carry
    //1 -> 0, R
    cyLabel = "🔍 " + '1' + " | ✎ " + '0' + " | " + "⮜";
    cyCreateEdge(1, 1, cyLabel, '1');
    turingMachine.createTransition(turingMachine.getStatebyId(1), '1', turingMachine.getStatebyId(1), '0', 'L')
    //0 -> 1, L
    cyLabel = "🔍 " + '0' + " | ✎ " + '1' + " | " + "➤";
    cyCreateEdge(1, 2, cyLabel, '0');
    turingMachine.createTransition(turingMachine.getStatebyId(1), '0', turingMachine.getStatebyId(2), '1', 'R')
    //"" -> 1, L
    cyLabel = "🔍 " + '' + " | ✎ " + '1' + " | " + "➤";
    cyCreateEdge(1, 2, cyLabel, '');
    turingMachine.createTransition(turingMachine.getStatebyId(1), '', turingMachine.getStatebyId(2), '1', 'R')

    //Create alphabet
    turingMachine.sigma.add(0);
    turingMachine.sigma.add(1);
    turingMachine.gamma.add(0);
    turingMachine.gamma.add(1);


}

/**
 * Handles Dropdown menu & calls functions accordingly (upon change)
 */

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

