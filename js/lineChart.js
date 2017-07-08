class LineChart {


    constructor(data = []) {

        this._data = data.map(function(d) {
            d.date = new Date(d.date);
            return d;
        });

        this._isFull = false;
        this._capacity = data.length || 5;
        this._duration = 1000;
        this._xOffset = 0;
        this._margin = {
            left: 30,
            top: 10,
            right: 20,
            bottom: 25
        };
    }


    setCapacity(capacity) {

        this._capacity = capacity;
        return this;
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
            .attr('transform', 'translate(' + [0, this._getXAxisYOffset()] + ')')
            .call(d3.axisBottom(this._getXScale()));

        this._yAxisContainer
            .call(d3.axisLeft(this._getYScale()));

        this._originalXScale = this._getXScale().copy();

        this._path
            .attr('d', this._getLineGenerator());

        return this;
    }


    update(data) {
        /*
         * Get copy of previously used xScale.
         */
        var xScale = this._getXScale().copy();
        /*
         * Caclulate line offset depending on capacity.
         */
        if (this._data.length < this._capacity) {
            this._xOffset = 0;
        } else {
            /*
             * After inner data array will be fulled we
             * should use lastly used x scale function.
             */
            if (! this._isFull) {
                this._originalXScale = xScale.copy();
                this._isFull = true;
            }
            /*
             * Get x coordinates of two last points.
             */
            var x1 = xScale(this._data[this._data.length - 1].date);
            var x2 = xScale(this._data[this._data.length - 2].date);
            /*
             * Calculate distance between them and multiply on input array size.
             */
            this._xOffset += (x2 - x1) * data.length;
        }
        /*
         * Push input into data array.
         */
        data.forEach(function(d) {
            d.date = new Date(d.date);
            this._data.push(d);
        }, this);
        /*
         * Calculate animation duration time.
         */
        var duration = this._duration * data.length;
        /*
         * Inner data array should to have at least two points to draw a line.
         */
        if (this._data.length <= 1) {
            return;
        }
        /*
         * Try to shift x axis to Y's zero value.
         */
        this._xAxisContainer
            .transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .attr('transform', 'translate(' + [0, this._getXAxisYOffset()] + ')');
        /*
         * Update x axis.
         */
        this._xAxisContainer
            .transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .call(d3.axisBottom(this._getXScale()));
        /*
         * Update y axis.
         */
        this._yAxisContainer
            .transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .call(d3.axisLeft(this._getYScale()));
        /*
         * Depending on data size transform line itself or just slide it to the left.
         */
        if (this._data.length <= this._capacity) {
            this._path
                .transition()
                .duration(duration)
                .ease(d3.easeLinear)
                .attr('d', this._getLineGenerator())
        } else {
            this._path
                .attr('d', this._getLineGenerator())
                .transition()
                .duration(duration)
                .ease(d3.easeLinear)
                .attr('transform', 'translate(' + (this._xOffset) + ', 0)');
        }

        while (this._capacity < this._data.length) {
            this._data.shift();
        }
    }


    /**
     * Get x axis y offset.
     * X axis should be aligned by Y's zero value. If zero value not present
     * in Y rabge X axis will be in the bottom of the chart.
     */
    _getXAxisYOffset() {

        const yScale = this._getYScale();
        const extent = d3.extent(this._data, d => d.price);

        if (extent[0] < 0 && extent[1] > 0) {
            return yScale(0);
        } else {
            return this._getInnerHeight();
        }
    }


    _getLineGenerator() {

        var xScale;
        if (this._data.length <= this._capacity) {
            xScale = this._getXScale();
        } else {
            xScale = this._originalXScale;
        }

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
