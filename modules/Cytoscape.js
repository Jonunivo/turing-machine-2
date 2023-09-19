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

function cyCreateNode(id, xPos=200, yPos=200, color='grey', border=false){
    //ensure creating within box & distance from each other
    let xDistance = 150;
    let yDistance = 100;
    xPos = Math.max(50, (50 + xDistance*id) % document.getElementById('cytoscape').clientWidth);
    yPos = 80 + yDistance*(Math.floor((50 + id*150) / document.getElementById('cytoscape').clientWidth));
    let label = id;
    //border
    let borderWidth = 0;
    let borderColor = 'white';
    if(border){
        borderWidth = 2;
        borderColor = 'black'
    }

    //core
    cy.add({
        group: 'nodes',
        data: {id: id},
        style: {
            'background-color': `${color}`,
            'border-width': `${borderWidth}`, // Set the border width for the nodes
            'border-color': `${borderColor}`,
            'label': `${label}`,
            "text-valign": "center",
            "text-halign": "center",
        },
        position: { x: xPos, y: yPos},
    });
}

