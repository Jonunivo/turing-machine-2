import cytoscape from '../node_modules/cytoscape/dist/cytoscape.esm.min.js';
//cytoscape object
var cy = cytoscape({
    container: document.getElementById('cytoscape'),
    style: [
    {
        selector: 'node',
        style: {
            shape: 'round-rectangle',
            'background-color': 'red',
            'width': '50px',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': 'blue'
        }
    },
    {
        
        selector: 'edge',
        style: {
            'line-color': 'black',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': 'blue',
            'curve-style': 'bezier',
            'loop-direction': '0deg'
        }
        
    }],

    // disable panning & zooming
    zoomingEnabled: false,
    userPanningEnabled: false,
  });


  cy.add({
    group: 'nodes',
    data: { weight: 75 },
    position: { x: 200, y: 200 },
  });

