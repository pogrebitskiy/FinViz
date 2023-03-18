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
    const formatYear = d3.timeFormat("%Y");
    // Frame 1: Stacked Bar

    // logging the first 10 rows, as required
    console.log(data.slice(0,10));

    // Example on how to pull year
    console.log(parseDate('2010-09-30').getFullYear());

    console.log(data.columns.slice(1));

    let all_tickers = Array.from(new Set(data.map(d => d.tic)));
    console.log(all_tickers)



    // Populate dropdown with year choices
    let choose_years = new Set(data.map(d => d.fyear));
    d3.select("#selectYear")
      .selectAll("option")
      .data([...choose_years])
      .enter()
      .append("option")
      .text(d => d);


    // Initialize first year to render site with
    let cur_year = d3.select("#selectYear").node().value;

    // Add event listener to plot, changes with dropdown changes
    d3.select('#selectYear').on('change', updatePlot);


    function updatePlot() {
        cur_year = d3.select("#selectYear").node().value;

        // Clear the frame of all bars
        FRAME1.selectAll("rect").remove();

        // Plots the new bars
        plot_bars();
    }

    const PADDING = 0.12;

    const groups = data.map(d => d.tic);
    console.log(groups);

    // creating scales
    const X_SCALE = d3.scaleBand()
    .domain(groups)
    .range([0, VIS_WIDTH])
    .padding(PADDING);

    // not working as expected: FIXED
    const Y_MAX = d3.max(data, (d) => {
        return Math.max(d.at/d.at, d.lt/d.at, d.teq/d.at)
    });
    console.log(Y_MAX);

    // y scale needed
    const Y_SCALE = d3.scaleLinear()
    .domain([0, Y_MAX])
    .range([VIS_HEIGHT, 0])

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
        .text('Proportion of Total Assets')
        .attr('font-size', '12px')
        .attr('transform', 'rotate(-90)')

    // add x axis
    FRAME1.append('g')
        .attr('transform', 'translate(' + MARGINS.left + ',' + (VIS_HEIGHT + MARGINS.top) + ')')
        .call(d3.axisBottom(X_SCALE).ticks(3))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('transform', 'rotate(-45)');

    // x axis label
    FRAME1.append('text')
        .attr('x', VIS_WIDTH/2 + MARGINS.left)
        .attr('y', FRAME_HEIGHT - 20)
        .style('text-anchor', 'middle')
        .text('Ticker')
        .attr('font-size', '12px');



    // Create svg container for each type of bar: asset, liab, eq
    g_assets = FRAME1.append('g').classed('asset-bars', true);
    g_liab = FRAME1.append('g').classed('liability-bars', true);
    g_eq = FRAME1.append('g').classed('equity-bars', true);

    // Initialize viz before anything selected
    updatePlot();

    function plot_bars() {

        // Specify desired columns
        const asset_subgroups = ['plot_act', 'plot_ppent', 'plot_ivaeq', 'plot_ivao', 'plot_intan', 'plot_ao'];
        const liab_subgroups = ['plot_lct', 'plot_txditc', 'plot_lo', 'plot_dltt']
        const eq_subgroups = ['plot_ceq', 'plot_pstk', 'plot_mibn']

        // Create color map and bar stack series
        const asset_color = d3.scaleOrdinal()
            .domain(asset_subgroups)
            .range(['#004c6d', '#346888', '#5886a5', '#7aa6c2', '#9dc6e0', '#c1e7ff']);
        const asset_stack = d3.stack()
            .keys(asset_subgroups)
            (data.filter(d => d.fyear === cur_year));

        // Create color map and bar stack series
        const liab_color = d3.scaleOrdinal()
            .domain(liab_subgroups)
            .range(['#5d0103', '#971c1f', '#cc3334', '#ff4949']);
        const liab_stack = d3.stack()
            .keys(liab_subgroups)
            (data.filter(d => d.fyear === cur_year));

        // Create color map and bar stack series
        const eq_color = d3.scaleOrdinal()
            .domain(eq_subgroups)
            .range(['#005a13', '#37ad14', '#65ff00']);
        const eq_stack = d3.stack()
            .keys(eq_subgroups)
            (data.filter(d => d.fyear === cur_year));


        const bandwidth = 10;

        // Fill svg container with individual svgs
        let asset_bars = g_assets
            .selectAll('g.series')
            .data(asset_stack)
            .join('g')
            .classed('series', true)
            .style('fill', (d) => asset_color(d.key))

        asset_bars.selectAll('rect')
            .data((d) => d)
            .join('rect')
            .attr('width', bandwidth)
            .attr('x', (d) => X_SCALE(d.data.tic) + MARGINS.right)
            .attr('height', (d) => Y_SCALE(d[0]) - Y_SCALE(d[1]))
            .attr('y', (d) => Y_SCALE(d[1]) + MARGINS.bottom);

        let liab_bars = g_liab
            .selectAll('g.series')
            .data(liab_stack)
            .join('g')
            .classed('series', true)
            .style('fill', (d) => liab_color(d.key))

        liab_bars.selectAll('rect')
            .data((d) => d)
            .join('rect')
            .attr('width', bandwidth)
            .attr('x', (d) => X_SCALE(d.data.tic) + bandwidth + MARGINS.right)
            .attr('height', (d) => Y_SCALE(d[0]) - Y_SCALE(d[1]))
            .attr('y', (d) => Y_SCALE(d[1]) + MARGINS.bottom);

        let eq_bars = g_eq
            .selectAll('g.series')
            .data(eq_stack)
            .join('g')
            .classed('series', true)
            .style('fill', (d) => eq_color(d.key))

        eq_bars.selectAll('rect')
            .data((d) => d)
            .join('rect')
            .attr('width', bandwidth)
            .attr('x', (d) => X_SCALE(d.data.tic) + bandwidth * 2 + MARGINS.right)
            .attr('height', (d) => Y_SCALE(d[0]) - Y_SCALE(d[1]))
            .attr('y', (d) => Y_SCALE(d[1]) + MARGINS.bottom);

    };


    // // test stack
    // FRAME1.append("g")
    //         .selectAll("g")
    //         // Enter in the stack data
    //         .data(asset_stack)
    //         .enter().append("g")
    //         .attr()
    //         .attr("fill", function(d) { return asset_color(d.key); })
    //         .selectAll("rect")
    //         // enter a second time = loop subgroup per subgroup to add all rectangles
    //         .data(function(d) { return d; })
    //         .enter().append("rect")
    //         .attr("x", function(d) { return MARGINS.left + X_SCALE(d.data.tic); })
    //         .attr("y", function(d) { return MARGINS.bottom + Y_SCALE(d[1]); })
    //         .attr("height", function(d) {return Y_SCALE(d[0]) - Y_SCALE(d[1]); })
    //         .attr("width",bandwidth)


    // Frame 2: Time Series Line
    console.log(data);
    const years = data.map(d => parseDate(d.datadate).getFullYear());

    const groupedData = d3.group(data, d => d.tic);
    
    // creating scales
    const X_SCALE2 = d3.scaleBand()
    .domain(years)
    .range([0, VIS_WIDTH])
    .padding(PADDING);

    // finding max asset total
    const Y_MAX2 = d3.max(data, (d) => {
        return Math.max(d.at)
    });

    // y scale needed
    const Y_SCALE2 = d3.scaleLinear()
        .domain([0, Y_MAX2])
        .range([VIS_HEIGHT, 0]);

    // add y axis
    FRAME2.append('g')
        .attr('transform', 'translate(' + MARGINS.top + ',' + MARGINS.left + ')')
        .call(d3.axisLeft(Y_SCALE2).ticks(10))
        .attr('font-size', '10px');

    // add x axis
    FRAME2.append('g')
        .attr('transform', 'translate(' + MARGINS.left + ',' + (VIS_HEIGHT + MARGINS.top) + ')')
        .call(d3.axisBottom(X_SCALE2).ticks(3))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('transform', 'rotate(-45)');

    // y axis label
    FRAME2.append('text')
        .attr('y', 25)
        .attr('x', 0 - VIS_HEIGHT/2 - MARGINS.top)
        .style('text-anchor', 'middle')
        .text('Amount in Thousands of Dollars')
        .attr('font-size', '12px')
        .attr('transform', 'rotate(-90)');

    // x axis label
    FRAME2.append('text')
        .attr('x', VIS_WIDTH/2 + MARGINS.left)
        .attr('y', FRAME_HEIGHT - 20)
        .style('text-anchor', 'middle')
        .text('Year')
        .attr('font-size', '12px');

    FRAME2.selectAll(".line")
        .data(groupedData)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => {
          let lineData = d3.line()
            .x(d => X_SCALE2(formatYear(parseDate(d.datadate))))
            .y(d => Y_SCALE2(d.aot));
          return lineData(d[1]);
        })
        .attr("stroke", (d, i) => d3.schemeCategory10[i % 10])
        .attr("fill", "none");
        

});
