///This file is currently not used



import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';

//////////////////////////////////////////////////////////////
//// -------------------- Cytoscape --------------------- ////
//////////////////////////////////////////////////////////////
//// ----------- Cytoscape object
var cy_sub = cytoscape({
    container: document.getElementById('cytoscape_sub'),
    style: [
    {
        selector: 'node',
        style: {
            shape: 'round-rectangle',
            'background-color': 'red',
            'width': '50px',
        }
    },
    {
        
        selector: 'edge',
        style: {
            'line-color': '#404040',
            'width': 2,
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#2371f7',
            'curve-style': 'bezier',
            'loop-direction': '0deg'
        }
        
    }],

    // disable panning & zooming
    zoomingEnabled: false,
    userPanningEnabled: false,
})