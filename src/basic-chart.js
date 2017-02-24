export class BasicChart {
    constructor(data,containerId) {
        let d3 = require('d3');
        this.data = data;
        containerId = containerId ? `#${containerId}` : '#chart';
        this.svg = d3.select(containerId).append('svg');
        this.margin = {
            left: 50,
            top: 30,
            right: 30,
            bottom: 30
        };
        this.svg.attr('width', window.innerWidth);
        this.svg.attr('height', window.innerHeight * 2/3);
        this.width = window.innerWidth - this.margin.left - this.margin.right;
        this.height = (window.innerHeight * 2/3) - this.margin.top - this.margin.bottom;
        this.chart = this.svg.append('g')
                         .attr('width', this.width)
                         .attr('height', this.height)
                         .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
    }

    destroy() {
        this.svg.remove();
    }
}