# Turing Machine Simulator

## Introduction

This is a program built as part of a Bachelor's Thesis by Mauro Vogel at the Department of Computer Science, Algorithms and Didactics at ETH Zurich.

In this Turing machine simulator, users can create and modify their own Turing machines. The program is capable of saving and loading Turing machine builds, allowing users to save and share their progress. The core elements (tape, states, transitions) are visually represented and the simulation is animated. Furthermore, users can create Turing machines as a "state" to created deeper and more involved Turing machines by nesting Turing machines.

The program is uploaded to https://n.ethz.ch/~mavogel/turing-machine/

## Installation

To use this program, it suffices to upload all the files in this repository onto a webserver. No installation or special server configuration is required. 

To try it out locally, using VSCode with the Live Preview or the Live Server Extension is recommended.

### Adding custom Presets

To add your own presets, two steps are necessary:

1. **Savefile Addition:**
   - Include the `.json` savefile of the Turing machine in the presets folder.

2. **Configuration in Presets.js:**
   - Open the "Presets.js" file.
   - Add the filename to the `fileList` array.
   - Add a corresponding name to the preset in the `presetNames` array.
