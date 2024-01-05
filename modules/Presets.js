import { cyCreateNode, cyCreateEdge, cyClearCanvas, cyGrabifyNodes } from "./Cytoscape.js";
import { cyTapeClear } from "./CytoscapeTape.js";
import { turingMachine } from "./TuringMachine.js";
import { nodePresetHelper, nodePresetReset } from "./UserInput.js";
import {loadFile} from "./SaveLoad.js"



/**
 * Empties canvas & tape & turingMachine object,
 * called when loading preset
 */
function empty(){
    //load binary Increment preset
    const filePath = 'https://n.ethz.ch/~mavogel/version-b/presets/empty.json';


    fetch(filePath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then(data => {
        // read File & call loadFile method (SaveLoad.json)
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const reader = new FileReader();
        reader.readAsText(blob);
        loadFile(reader);
      })
      .catch(error => {
        console.error('Error reading file:', error);
      });
}

/**
 * Loads Preset 1 (binary Increment)
 *  - calls SaveLoad's load function to load file from ../presets
 */
function loadPresetOne(){
    //load binary Increment preset
    const filePath = 'https://n.ethz.ch/~mavogel/version-b/presets/binaryincrement.json';


    fetch(filePath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then(data => {
        // read File & call loadFile method (SaveLoad.json)
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const reader = new FileReader();
        reader.readAsText(blob);
        loadFile(reader);
      })
      .catch(error => {
        console.error('Error reading file:', error);
      });
}

/**
 * Loads Preset 1 (ab Palindrom checker)
 *  - calls SaveLoad's load function to load file from ../presets
 */
function loadPresetTwo(){
    //ab Palindrom
    const filePath = 'https://n.ethz.ch/~mavogel/version-b/presets/abPalindrome.json';

    fetch(filePath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then(data => {
        // read File & call loadFile method (SaveLoad.json)
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const reader = new FileReader();
        reader.readAsText(blob);
        loadFile(reader);
      })
      .catch(error => {
        console.error('Error reading file:', error);
      });
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
        else if (presetSelect.value === "PresetTwo") {
            loadPresetTwo();
            console.log("PresetTwo clicked");
        } 
        // Add more conditions for other options as needed
    });

