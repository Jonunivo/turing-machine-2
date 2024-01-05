import { cyCreateNode, cyCreateEdge, cyClearCanvas, cyGrabifyNodes } from "./Cytoscape.js";
import { cyTapeClear } from "./CytoscapeTape.js";
import { turingMachine } from "./TuringMachine.js";
import { nodePresetHelper, nodePresetReset } from "./UserInput.js";
import {loadFile} from "./SaveLoad.js"

// Add filenames from the presets folder to this list and their correcponding name to presetNames list
// to add them as Presets to the simulator
const fileList = ['empty.json', 'binaryincrement.json', 'abPalindrome.json', 'copyOnes.json', 'countWordLength.json', 'base10divby3.json']
const presetNames = ['No Preset', 'Binary Increment', 'ab Palindrome', 'copy Ones', 'Word Length', 'divisible by 3 base10']

/**
 * Generate selectElements from file list & presetNames
 */
function createPresets(){

    //the select element

    const selectElement = document.getElementById("presetSelect");

    //for every file in fileList
    for(let i = 0; i<fileList.length; i++){

      // Loop through the preset options and create option elements
      var option = document.createElement("option");

      // Set the value and text content of the option
      option.value = fileList[i];  // You can set the value to whatever you need
      if(presetNames[i]){
        option.text = presetNames[i];
      }
      else{
        option.text = "unnamed preset";
      }

      // Append the option to the select element
      selectElement.appendChild(option);
    }
}
createPresets();

/**
 * Load Preset clicked on
 */
var presetSelect = document.getElementById("presetSelect");
presetSelect.addEventListener("change", function() {
    var selectedValue = presetSelect.value;

    ////get absolute path
    // Get the URL of the current module
    const moduleUrl = new URL(import.meta.url);
    //relative path
    const relativePath = `../presets/${selectedValue}`;
    //combine to get absolute path
    const filePath = new URL(relativePath, moduleUrl).pathname;


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
});

/* code not used anymore



// Empties canvas & tape & turingMachine object,
// called when loading preset

function empty(){
    //load empty
    ////get filepath
    // Get the URL of the current module
    const moduleUrl = new URL(import.meta.url);
    //relative path
    const relativePath = '../presets/empty.json';
    //combine to get absolute path
    const filePath = new URL(relativePath, moduleUrl).pathname;

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


// Loads Preset 1 (binary Increment)
//  - calls SaveLoad's load function to load file from ../presets

function loadPresetOne(){
    //load binary Increment preset
    ////get filepath
    // Get the URL of the current module
    const moduleUrl = new URL(import.meta.url);
    //relative path
    const relativePath = '../presets/binaryincrement.json';

    //combine to get absolute path
    const filePath = new URL(relativePath, moduleUrl).pathname;


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


// Loads Preset 1 (ab Palindrom checker)
//- calls SaveLoad's load function to load file from ../presets

function loadPresetTwo(){
    //ab Palindrom
    ////get filepath
    // Get the URL of the current module
    const moduleUrl = new URL(import.meta.url);
    //relative path
    const relativePath = '../presets/abPalindrome.json';

    //combine to get absolute path
    const filePath = new URL(relativePath, moduleUrl).pathname;

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


//Handles Dropdown menu & calls functions accordingly (upon change)
 

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

*/