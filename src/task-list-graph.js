import * as helper from './helper';
import {BasicChart} from './basic-chart';
let d3 = require('d3');
let dagreD3 = require('dagre-d3');
let $ = require('jquery');
require('jquery-ui/dialog');

export class TaskListGraph extends BasicChart {
    constructor(data,containerId) {
        super(data,containerId);
        let p;
        if(data){
            p = Promise.resolve();
        } else {
            p = this.loadData();
        }
        p.then(() => {
            console.log('Executing tasklist graph');
            this.taskListGraph();
        });
        //return p;
    }

    loadData() {
        let p = new Promise((res,rej) => {
            d3.json('data/taskList.json', (err, data) => {
                if(err) {
                    rej(err);
                }else{
                    res(data);
                }
            });
        });

        p.then(data => {
            console.log('got the data: ' + data);
            this.data = data;
        });

        return p;
    }

    taskListGraph() {
        //this.chart.selectAll('*').remove();
        let graph = helper.createTaskListGraph(this.data, d => d.wfTaskId, d => d.taskName);

        let zoom = d3.behavior.zoom().on("zoom", () => {
            this.chart.attr("transform", `translate(${d3.event.translate}) scale(${d3.event.scale})`);
        });
        this.chart.call(zoom).on('dblclick.zoom', null);

        let render = new dagreD3.render();
        render(this.chart, graph);
        let taskNodes = this.svg.selectAll('.node circle, .node polygon')
            .classed('task-nodes', true)
            .each(function(d,i){
                let task = graph.node(d).taskObj;
                const taskClass = helper.getTaskClass(task);
                this.classList.add(taskClass);
            })
            .on('mouseover', (nodeDatum,i) => {
                innerPaths.classed('hide', (pathDatum, i) => {
                    if(pathDatum.v === nodeDatum){
                        return false;
                    }
                    return true;
                });
            })
            .on('mouseout', (nodeDatum,i) => {
                innerPaths.classed('hide', 'true');
            })
            .on('dblclick', function(taskId, i) {
                let task = graph.node(taskId).taskObj;
                if(task.children && task.children.length > 0){
                    let subgraph = new TaskListGraph(task.children, 'sub-chart');
                    $('#sub-chart').dialog({
                        title: task.taskName,
                        width: 800,
                        position: {my:'left top', at: 'left+100 top+100', of: '#chart'},
                        modal: true,
                        close: () => {
                            $('#sub-chart').dialog('destroy');
                            subgraph.destroy();
                        }
                    });
                }else {
                    showTaskDetails(task, this);
                }
            });
        
        let innerPaths = this.svg.selectAll('.edgePath')
            .append('path')
            .attr('d', function() {
                return d3.select(this.parentNode.firstChild).attr('d');
            })
            .attr('style', function() {
                return d3.select(this.parentNode.firstChild).attr('style');
            })
            .classed('innerPath hide', true);
        
        this.svg.selectAll('.node .label text')
            .attr('transform', data => {
                return `translate(-5, 35)`;
            });
        helper.createGradients(this.svg);
    }
}

function showTaskDetails(task,element) {
    let div =d3.select('#parent-container')
        .append('div')
        .attr('id', 'task-details');

    let excludeDetails = ['wfTaskId','predecessor','dependants','children'];
    let taskDetails = [];
    for(let i in task) {
        if(excludeDetails.indexOf(i) === -1) {
            let propertyName = i.replace(/([A-Z])/g,' $1')
                .replace(/^./, str => str.toUpperCase())
                .concat(':');
            let value = task[i];
            taskDetails.push([propertyName,value]);
        }
    }    
    helper.createTable(div,taskDetails,d => d, d => d);
    
    $('#task-details').dialog({
        title: 'Task Details',
        width: 420,
        position: { my: 'left top', at: 'center', of: element },
        modal: true,
        resizable: false,
        close: () => {
            $('#task-details').dialog('destroy');
            div.remove();
        }
    });
}