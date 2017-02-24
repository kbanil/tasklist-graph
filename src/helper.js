let d3 = require('d3');
let dagreD3 = require('dagre-d3');
let graphlib = require('graphlib');
const btnGradients = [
            {
                id: 'grad-not-started',
                offsets: [0,50,51,100],
                dimensions: {
                    cx: '0.5',
                    cy: '0.5',
                    r: '0.7',
                    fx: '0.5',
                    fy: '0.5'
                },
                spreadMethod: 'pad'
            },
            {
                id: 'grad-segment',
                offsets: [0,50,51,100],
                dimensions: {
                    cx: '0.5',
                    cy: '0.5',
                    r: '0.7',
                    fx: '0.5',
                    fy: '0.5'
                },
                spreadMethod: 'pad'
            },
            {
                id: 'grad-skipped',
                offsets: [0,36,100],
                dimensions: {
                    cx: '0.3',
                    cy: '0.3',
                    r: '0.7',
                    fx: '0.4',
                    fy: '0.4'
                },
                spreadMethod: 'pad'
            },
            {
                id: 'grad-completed',
                offsets: [0,33,100],
                dimensions: {
                    cx: '0.3',
                    cy: '0.3',
                    r: '0.7',
                    fx: '0.4',
                    fy: '0.4'
                },
                spreadMethod: 'pad'
            },
            {
                id: 'grad-errored',
                offsets: [0,45,100],
                dimensions: {
                    cx: '0.3',
                    cy: '0.3',
                    r: '0.7',
                    fx: '0.4',
                    fy: '0.4'
                },
                spreadMethod: 'pad'
            },
            {
                id: 'grad-default',
                offsets: [0,100],
                dimensions: {
                    cx: '0.3',
                    cy: '0.3',
                    r: '0.7',
                    fx: '0.4',
                    fy: '0.4'
                },
                spreadMethod: 'pad'
            }
];

export function uniques(data,name) {
    let uniques = [];
    data.forEach(d => {
        if(uniques.indexOf(name(d)) < 0) {
            uniques.push(name(d));
        }
    });
    return uniques;
}

export function nameId(data,name) {
    let uniqueNames = uniques(data,name);
    return d3.scale.ordinal()
            .domain(uniqueNames)
            .range(d3.range(uniqueNames.length));
}

export function taskLinks(data, id, name) {
    let nameIds = nameId(data, id);
    let links = [];
    data.forEach(d => {
        if(d.dependants.length === 0) {
            return;
        }
        d.dependants.forEach(dTask => {
            links.push({
                source: nameIds(id(d)),
                sourceName: name(d),
                target: nameIds(dTask)
                //targetName: name(this.target),
            });
        });
    });
    return links;
}

export function createTaskListGraph(data, id, name) {
    // let graph = new dagreD3.graphlib.Graph()
    //                 .setGraph({rankdir: 'LR', ranksep: 50, nodesep: 15});
    let graph = new graphlib.Graph().setGraph({rankdir: 'LR', ranksep: 120, nodesep: 40});
    
    //Map each task to derive a node and add that node to the graph
    data.forEach(task => {
        let shape = 'circle';
        let nodeLabel = name(task);
        if(task.taskName === 'Merge') {
            shape = 'diamond';
            nodeLabel = '';
        }
        graph.setNode(id(task), {label: nodeLabel, labelpos: 'l', shape: shape, width: 30, height: 30, taskObj: task});
    });

    //Add edges to the newly created nodes based on task dependants
    data.forEach(task => {
        if(task.dependants && task.dependants.length) {
            task.dependants.forEach(dependant => {
                graph.setEdge(id(task), dependant, {label: '', lineInterpolate: 'basis', arrowhead: 'undirected'});
            });
        }
    });
    return graph;
}

export function createGradients(svg){
    svg = svg || d3.select('svg');

    let gradients = svg.append('defs')
        .selectAll('radialGradient')
        .data(btnGradients)
        .enter()
        .append('radialGradient')
        .attr('id', gradient => gradient.id)
        .attr('cx', gradient => gradient.dimensions.cx)
        .attr('cy', gradient => gradient.dimensions.cy)
        .attr('r', gradient => gradient.dimensions.r)
        .attr('fx', gradient => gradient.dimensions.fx)
        .attr('fy', gradient => gradient.dimensions.fy)
        .attr('spreadMethod', gradient => gradient.spreadMethod);
    
    gradients.selectAll('stop')
            .data(gradient => gradient.offsets)
            .enter()
            .append('stop')
            .attr('offset', (offset) => `${offset}%`)
            .attr('class',(d,i) => `stop${i+1}`);

    //click 0.3,0.3,0.7,0.4,0.4
    //0.5,0.5,1.1,0.1,0.1
}

export function getTaskClass(task) {
    if(task.children && task.children.length) {
        return 'grad-segment';
    }
    switch(task.status) {
        case 'Completed' : return 'grad-completed';
        case 'Skipped' : return 'grad-skipped';
        case 'Not Started' : return 'grad-not-started';
        case 'Errored' : return 'grad-errored';
        case 'In Progress' : 
        default: return 'grad-default' ;
    }
}

export function createTable(container, data, rowAccessor, cellAccessor) {
    let tableBody = container.append('table').append('tbody');
    let rows = tableBody.selectAll('tr')
        .data(data)
        .enter()
        .append('tr');
    
    rows.selectAll('td')
        .data(d => rowAccessor(d))
        .enter()
        .append('td')
        .classed('property-name', (d,i) => i === 0)
        .text(d => cellAccessor(d));
}

export function drawLegend() {
    let legendData = [
        {
            status: 'Not Started',
            description : 'Not Started'
        },
        {
            status: 'In Progress',
            description : 'In Progress'
        },
        {
            status: 'Completed',
            description : 'Completed'
        },
        {
            status: 'Skipped',
            description : 'Skipped'
        },
        {
            status: 'Errored',
            description : 'Errored'
        },
        {
            status: 'Segment',
            description : 'Segment/Compound Task',
            children: [1,2]
        }
    ];

    let legend = d3.select('#parent-container')
        .append('div')
        .attr('id','legend');
    
    let tableBody = legend.append('table')
        .append('tbody');
    
    let rows = tableBody.selectAll('tr')
        .data(legendData)
        .enter()
        .append('tr');

    rows.append('td')
        .classed('property-name', true);
    rows.append('td')
        .text(d => d.description);
        

    let svg = legend.selectAll('.property-name')
        .append('svg')
        .attr({
            width: 30,
            height: 30
        })
        .append('circle')
        .attr({
            r: 10,
            cx: 15,
            cy: 15
        })
        .style({
            stroke: '#333',
            'stroke-width': 0.3,
            'fill-opacity': 0.7,
        })
        .each(function(d) {
            const taskClass = getTaskClass(d);
            this.classList.add(taskClass);
        });
    
}