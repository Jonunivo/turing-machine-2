/*
  Author: Mauro Vogel
  Date: January 2024
  
  Description: 
    - Loads presets into the simulator using the loadFile function from SaveLoad.js.
    - Provides global arrays (fileList & presetNames) that can be changed to change the Presets provided to users.

  Dependencies/Imports:
    - SaveLoad.js | loadFile function

  Exports:
    none
*/

import {loadFile} from "./SaveLoad.js"

// Add filenames from the presets folder to this list and their correcponding name to presetNames list
// to add them as Presets to the simulator
const fileList = ['empty.json', 'binaryincrement.json', 'abPalindrome.json', 'copyOnes.json', 'countWordLength.json', 'base10divby3.json']
const presetNames = ['No Preset', 'Binary Increment', 'ab Palindrome', 'copy Ones', 'Word Length', 'divisible by 3 base10']

/**
 * Populates the presetSelect element with options based on the provided fileList and presetNames arrays.
 * Text content is "unnamed preset" if no name provided
 */
function createPresets(){
    const selectElement = document.getElementById("presetSelect");

    //Loop through the fileList and create option elements
    for(let i = 0; i<fileList.length; i++){
      var option = document.createElement("option");
      // Set the value and text content of the option
      option.value = fileList[i];
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
//run at page load
createPresets();

/**
 * EventListener to detect when a preset is selected.
 * it retrieves the selected value and fetches the file content.
 * Reads the file content using FileReader and calls the loadFile method.
 */
var presetSelect = document.getElementById("presetSelect");
presetSelect.addEventListener("change", function() {
    var selectedValue = presetSelect.value;

    ////get absolute path (relative path wouldn't work on n.ethz.ch/~mavogel)
    const moduleUrl = new URL(import.meta.url);
    const relativePath = `../presets/${selectedValue}`;
    //combine to get absolute path
    const filePath = new URL(relativePath, moduleUrl).pathname;

    //fetch file content
    fetch(filePath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      // read File & call loadFile method (from SaveLoad.json)
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const reader = new FileReader();
      reader.readAsText(blob);
      loadFile(reader);
    })
    .catch(error => {
      console.error('Error reading file:', error);
    });
});
