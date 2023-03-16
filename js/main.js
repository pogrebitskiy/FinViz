const FRAME_HEIGHT = 500;
const FRAME_WIDTH = 500;
const MARGINS = {left: 50,
                right: 50,
                top:50,
                bottom:50};

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

    // Frame 1: Stacked Bar

    // logging the first 10 rows, as required
    console.log(data.slice(0,10));

    const PADDING = 0.25;

    // creating scales
    const X_SCALE = d3.scaleBand()
    .domain(data.map(d => d.tic))
    .range([0, VIS_WIDTH])
    .padding(PADDING);

    // not working as expected
    const Y_MAX = d3.max(data, function(d){
        Math.max(d.at/d.at, d.lt/d.at, d.teq/d.at)
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

    // add x axis
    FRAME1.append('g')
        .attr('transform', 'translate(' + MARGINS.left + ',' + (VIS_HEIGHT + MARGINS.top) + ')')
        .call(d3.axisBottom(X_SCALE).ticks(3))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('transform', 'rotate(-45)')





    // Frame 2: Time Series Line


});
