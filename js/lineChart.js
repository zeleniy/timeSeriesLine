class LineChart {


    constructor(data) {

        this._data = data.map(function(d) {
            d.date = new Date(d.date);
            return d;
        });

        this._duration = 1000;
        this._xOffset = 0;
        this._margin = {
            left: 30,
            top: 10,
            right: 20,
            bottom: 25
        };
    }


    renderTo(selector) {

        this._container = d3.select(selector);

        var size = this._getSize();

        this._svg = this._container
            .append('svg')
            .attr('class', 'line-chart')
            .attr('width', size.width)
            .attr('width', size.height);

        this._canvas = this._svg
            .append('g')
            .attr('class', 'canvas');

        this._defs = this._canvas
            .append('defs')
            .append('clipPath')
            .attr('id', 'clip')
            .append('rect');

        this._g = this._canvas.append('g')
            .attr('clip-path', 'url(#clip)')

        this._path = this._g
            .append('path')
            .attr('class', 'line')
            .datum(this._data);

        this._xAxisContainer = this._canvas
            .append('g')
            .attr('class', 'axis x-axis');

        this._yAxisContainer = this._canvas
            .append('g')
            .attr('class', 'axis y-axis');

        return this.resize();
    }


    resize() {

        this._svg
            .attr('width', this._getOuterWidth())
            .attr('height', this._getOuterHeight());

        this._canvas
            .attr('transform', 'translate(' + [this._margin.left, this._margin.top] + ')');

        this._defs
            .attr('width', this._getInnerWidth())
            .attr('height', this._getInnerHeight());

        this._xAxisContainer
            .attr('transform', 'translate(' + [0, this._getInnerHeight()] + ')')
            .call(d3.axisBottom(this._getXScale()));

        this._yAxisContainer
            .call(d3.axisLeft(this._getYScale()));

        this._originalXScale = this._getXScale().copy();

        this._path
            .attr('d', this._getLineGenerator());

        return this;
    }


    update(data) {

        var xScale = this._getXScale().copy();
        var x1 = xScale(this._data[this._data.length - 1].date);
        var x2 = xScale(this._data[this._data.length - 2].date);

        this._xOffset += (x2 - x1) * data.length;
        var duration = this._duration * data.length;

        data.forEach(function(d) {
            d.date = new Date(d.date);
            this._data.push(d);
        }, this);

        this._xAxisContainer
            .transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .call(d3.axisBottom(this._getXScale()));

        this._yAxisContainer
            .transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .call(d3.axisLeft(this._getYScale()));

        this._path
            .attr('d', this._getLineGenerator(xScale))
            .transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .attr('transform', 'translate(' + (this._xOffset) + ',0)');

        data.forEach(function(d) {
            d.date = new Date(d.date);
            this._data.shift();
        }, this);
    }


    _getLineGenerator(xScale) {

        var xScale = this._originalXScale;
        var yScale = this._getYScale();

        return d3.line()
            .x(function(d) {
                return xScale(d.date);
            }).y(function(d) {
                return yScale(d.price);
            })//.curve(d3.curveMonotoneX);
    }


    _getXScale() {

        return d3.scaleTime()
            .range([0, this._getInnerWidth()])
            .domain(d3.extent(this._data, d => d.date));
    }


    _getYScale() {

        return d3.scaleLinear()
            .range([this._getInnerHeight(), 0])
            .domain(this._getYDomain());
    }


    _getYDomain() {

        var domain = d3.extent(this._data, d => d.price);
        var extent = 25;

        domain[0] += domain[0] > 0 ? domain[0] / -extent : domain[0] /  extent;
        domain[1] += domain[1] > 0 ? domain[1] /  extent : domain[1] / -extent;

        return domain;
    }


    _getSize() {

        return this._container.node().getBoundingClientRect();
    }


    _getOuterWidth() {

        return this._getSize().width;
    }


    _getOuterHeight() {

        return this._getSize().height || 400;
    }


    _getInnerWidth() {

        return this._getSize().width - this._margin.left - this._margin.right;
    }


    _getInnerHeight() {

        return this._getSize().height - this._margin.top - this._margin.bottom;
    }
}
