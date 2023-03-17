const FRAME_HEIGHT = 700;
const FRAME_WIDTH = 700;
const PADDING = 10;
const MARGINS = {left: 75,
                right: 75,
                top:75,
                bottom:75};

const FRAME1 = d3.select('#vis1')
                .append('svg')
                    .attr('height', FRAME_HEIGHT)
                    .attr('width', FRAME_WIDTH)
                    .attr('class', 'frame');

const FRAME2 = d3.select('#vis2')
                .append('svg')
                    .attr('height', FRAME_HEIGHT)
                    .attr('width', FRAME_WIDTH)
                    .attr('class', 'frame');

const VIS_HEIGHT = FRAME_HEIGHT - MARGINS.top - MARGINS.bottom
const VIS_WIDTH = FRAME_WIDTH - MARGINS.left - MARGINS.right



d3.csv('data/company_data.csv').then((data) => {

    // Function to parse date column
    const parseDate = d3.timeParse("%Y-%m-%d")

    // Frame 1: Stacked Bar

    // logging the first 10 rows, as required
    console.log(data.slice(0,10));

    // Example on how to pull year
    console.log(parseDate('2010-09-30').getFullYear());

    console.log(data.columns.slice(1))

    const PADDING = 0.25;

    const groups = data.map(d => d.tic);

    // creating scales
    const X_SCALE = d3.scaleBand()
    .domain(groups)
    .range([0, VIS_WIDTH])
    .padding(PADDING);

    // not working as expected: FIXED
    const Y_MAX = d3.max(data, (d) => {
        return Math.max(d.at/d.at, d.lt/d.at, d.teq/d.at)
    });

    // y scale needed
    const Y_SCALE = d3.scaleLinear()
    .domain([0, Y_MAX])
    .range([VIS_HEIGHT, 0]);

    // add y axis
    FRAME1.append('g')
        .attr('transform', 'translate(' + MARGINS.top + ',' + MARGINS.left + ')')
        .call(d3.axisLeft(Y_SCALE).ticks(10))
        .attr('font-size', '10px');

    // y axis label
    FRAME1.append('text')
        .attr('y', 25)
        .attr('x', 0 - VIS_HEIGHT/2 - MARGINS.top)
        .style('text-anchor', 'middle')
        .text('Percentage of Total Assets')
        .attr('font-size', '12px')
        .attr('transform', 'rotate(-90)')

    // add x axis
    FRAME1.append('g')
        .attr('transform', 'translate(' + MARGINS.left + ',' + (VIS_HEIGHT + MARGINS.top) + ')')
        .call(d3.axisBottom(X_SCALE).ticks(3))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('transform', 'rotate(-45)')

    // x axis label
    FRAME1.append('text')
        .attr('x', VIS_WIDTH/2 + MARGINS.left)
        .attr('y', FRAME_HEIGHT - 20)
        .style('text-anchor', 'middle')
        .text('Ticker')
        .attr('font-size', '12px')





    // Frame 2: Time Series Line



});
