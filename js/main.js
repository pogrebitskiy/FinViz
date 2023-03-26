const FRAME_HEIGHT = 750;
const FRAME_WIDTH = 750;
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

d3.csv('data/revdata.csv').then((data) => {

    // Function to parse date column
    const parseDate = d3.timeParse("%Y-%m-%d")
    const formatYear = d3.timeFormat("%Y");
    // Frame 1: Stacked Bar

    // logging the first 10 rows, as required
    console.log(data.slice(0,10));

    // will be used for mapping
    const DEFINITIONS = {
        act: 'Total Current Assets',
        ppent: 'Total Property, Plant, and Equipment',
        intan: 'Total Intangible Assets',
        ivaeq: 'Investments and Advances - Equity Method',
        ivao: 'Investments and Advances - Other',
        ao: 'Total Other Assets',
        lct: 'Total Current Liabilities',
        txditc: 'Deferred Taxes and Investment Tax Credit',
        lo: 'Other Liabilities',
        dltt: 'Total Long-Term Debt',
        ceq: 'Total Common/Ordinary Equity',
        pstk: 'Total Preferred/Preference Stock (Capital)',
        mibn: 'Nonredeemable Noncontrolling Interest'
    };

    // will be used for legends
    const vis1_keys = ['Assets', 'Liabilities', 'Equities'];
    const vis2_keys = ['Total Assets', 'Total Liabilities', 'Total Equities'];
    const key_colors = ['blue', 'red', 'green'];

    // Populate dropdown with year choices
    let choose_years = new Set(data.map(d => d.fyear));
    d3.select("#selectYear")
      .selectAll("option")
      .data([...choose_years])
      .enter()
      .append("option")
      .text(d => d);

    let all_tickers = Array.from(new Set(data.map(d => d.tic)));
    d3.select('#selectCompanies')
        .selectAll('label')
        .data([...all_tickers])
        .enter()
        .append('label')
        .each(function(){
                d3.select(this)
                    .append('input')
                    .attr('type', 'checkbox')
                    .attr('class', 'company_cb')
                    .attr('value', d => d)
                    .attr('checked', 'checked');

                d3.select(this)
                    .append('span')
                    .html(d => d)
                    .append("br");
            });


    // Initialize first year to render site with
    let cur_year = d3.select("#selectYear").node().value;

    let cur_companies = d3.selectAll('.company_cb:checked')
                        .nodes()
                        .map(node => node.value);

    // Add event listener to plot, changes with dropdown changes
    d3.select('#selectYear').on('change', updatePlot);

    d3.select('#selectCompanies').on('change', updatePlot);

    function updatePlot() {
        cur_year = d3.select("#selectYear").node().value;

        cur_companies = d3.selectAll('.company_cb:checked')
                        .nodes()
                        .map(node => node.value);

        // Clear the frame of all bars
        FRAME1.selectAll("rect").remove();
        FRAME1.selectAll(".axis").remove();

        // Plots the new bars
        plot_bars();
        tooltips();

        FRAME1.selectAll("rect")
            .filter(d => d.data.tic === selectedBars.tic)
            .style("opacity", 1);

        FRAME1.selectAll("rect")
            .filter(d => d.data.tic !== selectedBars.tic)
            .style("opacity", 0.4);
    }

    const PADDING = 0.4;

    // groups based off tic
    const groups = data.map(d => d.tic);

    // to assist with formating large numbers
    function formatNumber(num) {
        return num.toLocaleString();
      }

    //init tic value
    selectedBars = { tic: 'AAPL' };

    // creating scales
    const X_SCALE = d3.scaleBand()
    .domain(groups)
    .range([0, VIS_WIDTH])
    .padding(PADDING);

    // max y value
    const Y_MAX = d3.max(data, (d) => {
        return Math.max(d.at/d.at, d.lt/d.at, d.teq/d.at)
    });

    // y scale needed
    const Y_SCALE = d3.scaleLinear()
        .domain([0, Y_MAX])
        .range([VIS_HEIGHT, 0])

    // add y axis
    FRAME1.append('g')
        .attr('transform', 'translate(' + MARGINS.top + ',' + MARGINS.left + ')')
        .attr('class', 'axis')
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
        .attr('class', 'axis')
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

        let filtered_data = data.filter(d => cur_companies.includes(d.tic));

        // groups based off tic
        const groups = filtered_data.map(d => d.tic);

        // creating scales
        const X_SCALE = d3.scaleBand()
        .domain(groups)
        .range([0, VIS_WIDTH])
        .padding(PADDING);

        // max y value
        const Y_MAX = d3.max(filtered_data, (d) => {
            return Math.max(d.at/d.at, d.lt/d.at, d.teq/d.at)
        });

        // y scale needed
        const Y_SCALE = d3.scaleLinear()
            .domain([0, Y_MAX])
            .range([VIS_HEIGHT, 0])

        // add y axis
        FRAME1.append('g')
            .attr('transform', 'translate(' + MARGINS.top + ',' + MARGINS.left + ')')
            .attr('class', 'axis')
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
            .attr('class', 'axis')
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

        // Specify desired columns
        const asset_subgroups = ['plot_act', 'plot_ppent', 'plot_ivaeq', 'plot_ivao', 'plot_intan', 'plot_ao'];
        const liab_subgroups = ['plot_lct', 'plot_txditc', 'plot_lo', 'plot_dltt']
        const eq_subgroups = ['plot_ceq', 'plot_pstk', 'plot_mibn']

        // Create color map and bar stack series
        
        const asset_color = d3.scaleOrdinal()
            .domain(asset_subgroups)
            .range(['#00a9ff', '#51b5ff', '#84c8ff', '#b4e0ff', '#ceefff', '#ddf9ff']);
        const asset_stack = d3.stack()
            .keys(asset_subgroups)
            (filtered_data.filter(d => d.fyear === cur_year));

        // Create color map and bar stack series
        const liab_color = d3.scaleOrdinal()
            .domain(liab_subgroups)
            .range(['#ff0000', '#ff3921', '#ff6044', '#ff8870']);
        const liab_stack = d3.stack()
            .keys(liab_subgroups)
            (filtered_data.filter(d => d.fyear === cur_year));

        // Create color map and bar stack series
        const eq_color = d3.scaleOrdinal()
            .domain(eq_subgroups)
            .range(['#54ff00', '#afff8b', '#d7ffc2']);
        const eq_stack = d3.stack()
            .keys(eq_subgroups)
            (filtered_data.filter(d => d.fyear === cur_year));


        let liab_bars = g_liab
            .selectAll('g.series')
            .data(liab_stack)
            .join('g')
            .classed('series', true)
            .style('fill', (d) => liab_color(d.key))

        liab_bars.selectAll('rect')
            .data((d) => d)
            .join('rect')
            .attr('width', X_SCALE.bandwidth()/2)
            .attr('x', (d) => X_SCALE(d.data.tic) + MARGINS.right + X_SCALE.bandwidth() / 4)
            .attr('height', (d) => Y_SCALE(d[0]) - Y_SCALE(d[1]))
            .attr('y', (d) => Y_SCALE(d[1]) + MARGINS.bottom)
            .style("opacity", 0.4);

        // Fill svg container with individual svgs
        let asset_bars = g_assets
            .selectAll('g.series')
            .data(asset_stack)
            .join('g')
            .classed('series', true)
            .style('fill', (d) => asset_color(d.key));

        asset_bars.selectAll('rect')
            .data((d) => d)
            .join('rect')
            .attr('width', X_SCALE.bandwidth()/2)
            .attr('x', (d) => X_SCALE(d.data.tic) - X_SCALE.bandwidth() / 2 + MARGINS.right + X_SCALE.bandwidth() / 4)
            .attr('height', (d) => Y_SCALE(d[0]) - Y_SCALE(d[1]))
            .attr('y', (d) => Y_SCALE(d[1]) + MARGINS.bottom)
            .style("opacity", 0.4);


        let eq_bars = g_eq
            .selectAll('g.series')
            .data(eq_stack)
            .join('g')
            .classed('series', true)
            .style('fill', (d) => eq_color(d.key))

        eq_bars.selectAll('rect')
            .data((d) => d)
            .join('rect')
            .attr('width', X_SCALE.bandwidth()/2)
            .attr('x', (d) => X_SCALE(d.data.tic) + X_SCALE.bandwidth()/2 + MARGINS.right + X_SCALE.bandwidth() / 4)
            .attr('height', (d) => Y_SCALE(d[0]) - Y_SCALE(d[1]))
            .attr('y', (d) => Y_SCALE(d[1]) + MARGINS.bottom)
            .style("opacity", 0.4);

    };

    function tooltips() {
        // adding a tooltip for hover functionality
        const TOOLTIP = d3.select("#vis1")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px");

    // handling the mouse entering the space
    function handleMouseover(event, d) {
        TOOLTIP.style("opacity", 1);
        d3.select(this)
        .style("opacity", 1);
    }

    // handing a mouse movement
    function handleMousemove(event, d) {
        // will check the key where the val exists, but will have plot_ in front of it
        // 1 shows up as .99999 so we rounded to 6 decimal points when checking
        let key = Object.keys(d.data).find(k => d3.format(".6f")(parseFloat(d.data[k])) === d3.format(".6f")(d[1] - d[0]));
        
        let true_key = key.replace("plot_", "");

        // showing the tooltip with proper information
        TOOLTIP.html("<b>" + DEFINITIONS[true_key] + "</b><br/><i>" + d.data.conm + "</i><br/>Value: $" + formatNumber((d.data[true_key]*1000)) + 
        "<br/>" + d3.format(".2f")(100 * d.data[true_key] / d.data.at) + "% of Total Assets ($" + formatNumber(d.data.at * 1000) + ")")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 50) + "px");
    }

    // handling the mouse exiting
    function handleMouseleave(event, d) {
        TOOLTIP.style("opacity", 0)
        if (d.data.tic !== selectedBars.tic) {
            d3.select(this)
                .style("stroke", "none")
                .style("opacity", 0.4)
        }
    }

    function handleMouseclick(event, d) {
        selectedBars = { tic: d.data.tic };
        // Set the opacity of the clicked bars to 1 and update the selectedBars variable
        FRAME1.selectAll("rect")
            .filter(d => d.data.tic === selectedBars.tic)
            .style("opacity", 1);

        FRAME1.selectAll("rect")
            .filter(d => d.data.tic !== selectedBars.tic)
            .style("opacity", 0.4);

        updateLine(d.data.tic);
        d3.select("#tic-title")
        .text(d.data.tic + " Time-Series");
        document.getElementById('selectAccounts').value = 'All';
    }

    // tooltip functionality on different situations
    FRAME1.selectAll("rect")
        .on("mouseover", handleMouseover)
        .on("mousemove", handleMousemove)
        .on("mouseleave", handleMouseleave)
        .on("click", handleMouseclick);
    }

    // dot for legend
    FRAME1.selectAll("mydots")
        .data(vis1_keys)
        .enter()
        .append("circle")
        .attr("cx", VIS_WIDTH + MARGINS.left)
        .attr("cy", function(d,i){ return MARGINS.left + i*25}) 
        .attr("r", 4)
        .style("fill", function(d,i){ return key_colors[i]});

    // text for legend
    FRAME1.selectAll("mylabels")
        .data(vis1_keys)
        .enter()
        .append("text")
        .attr("x", VIS_WIDTH + MARGINS.left + 10)
        .attr("y", function(d,i){ return MARGINS.left + i*25})
        .style("fill", function(d,i){ return key_colors[i]})
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .style("font-size","12px");
        

    // Frame 2: Time Series Viz

    // for plotting different account breakdowns
    d3.select("#selectAccounts")
      .selectAll("option")
      .data(['All','Assets','Liabilities','Equities'])
      .enter()
      .append("option")
      .text(d => d);

    // finding the unique years in the data
    const years = Array.from(new Set(data.map(d => d.fyear)));
    

    // line plot update function
    function updateLine(tic) {    
        cur_tic = tic

        // Clear the frame of all lines as well as all circles
        FRAME2.selectAll("circle").remove();
        FRAME2.selectAll("path").remove();

        // get rid of all axis to recalc the y axis
        FRAME2.selectAll("g").remove();

        // Plots the new bars
        plot_lines();
        }
    
    function plot_lines() {
        // filtering by selected tic
        let filteredData = data.filter(function(d) {
            return d.tic === cur_tic;
          });
        
        Y_MAX2 = d3.max(filteredData, (d) => {
            return (Math.max(d.at) * 1.2)
        });

        Y_SCALE2 = d3.scaleLinear()
            .domain([0, Y_MAX2])
            .range([VIS_HEIGHT, 0]);

        X_SCALE2 = d3.scaleBand()
            .domain(years)
            .range([0, VIS_WIDTH]);

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

        // create an area where plotting will not happen
        const clip = FRAME2.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", VIS_WIDTH )
            .attr("height", VIS_HEIGHT )
            .attr("x", MARGINS.right)
            .attr("y",MARGINS.top);

        FRAME2.append('g')
            .attr("clip-path", "url(#clip)")

        // making a o- plot for total assets
        FRAME2.selectAll(".a-circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("class", "at")
            .attr("cx", d => X_SCALE2(parseInt(d.fyear)) + MARGINS.right + 25)
            .attr("cy", d => Y_SCALE2(d.at) + MARGINS.top)
            .attr("r", 5)
            .style("fill", "blue")
            .append("title")
            .text(d => "Value: $" + formatNumber(d.at * 1000) + " Year: " + d.fyear);
        
        FRAME2.append("path")
            .datum(filteredData)
            .attr("class", "line")
            .attr("d", d3.line()
                .x(d => X_SCALE2(parseInt(d.fyear)) + MARGINS.right + 25)
                .y(d => Y_SCALE2(d.at) + MARGINS.top))
            .style("stroke", "blue")
            .style("fill", "none");

        // making a o- plot for total liabilities
        FRAME2.selectAll(".l-circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("class", "lt")
            .attr("cx", d => X_SCALE2(parseInt(d.fyear)) + MARGINS.right + 25)
            .attr("cy", d => Y_SCALE2(d.lt) + MARGINS.top)
            .attr("r", 5)
            .style("fill", "red")
            .append("title") 
            .text(d => "Value: $" + formatNumber(d.lt * 1000) + " Year: " + d.fyear);

        FRAME2.append("path")
            .datum(filteredData)
            .attr("class", "line")
            .attr("d", d3.line()
                .x(d => X_SCALE2(parseInt(d.fyear)) + MARGINS.right + 25)
                .y(d => Y_SCALE2(d.lt) + MARGINS.top))
            .style("stroke", "red")
            .style("fill", "none");

        // making a o- plot for total equity
        FRAME2.selectAll(".e-circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("class", "teq")
            .attr("cx", d => X_SCALE2(parseInt(d.fyear)) + MARGINS.right + 25)
            .attr("cy", d => Y_SCALE2(d.teq) + MARGINS.top)
            .attr("r", 5)
            .style("fill", "green")
            .append("title") 
            .text(d => "Value: $" + formatNumber(d.teq * 1000) + " Year: " + d.fyear);
        
        FRAME2.append("path")
            .datum(filteredData)
            .attr("class", "line")
            .attr("d", d3.line()
                .x(d => X_SCALE2(parseInt(d.fyear)) + MARGINS.right + 25)
                .y(d => Y_SCALE2(d.teq) + MARGINS.top))
            .style("stroke", "green")
            .style("fill", "none");        

        // dot for legend
        FRAME2.selectAll("mydots")
            .data(vis2_keys)
            .enter()
            .append("circle")
            .attr("cx", MARGINS.right + 20)
            .attr("cy", function(d,i){ return MARGINS.left + i*25}) 
            .attr("r", 4)
            .style("fill", function(d,i){ return key_colors[i]});

        // text for legend
        FRAME2.selectAll("mylabels")
                .data(vis2_keys)
                .enter()
                .append("text")
                .attr("x", MARGINS.right + 25)
                .attr("y", function(d,i){ return MARGINS.left + i*25})
                .style("fill", function(d,i){ return key_colors[i]})
                .text(function(d){ return d})
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .style("font-size","12px");
    }    

    // defaults
    updateLine('AAPL');
    FRAME1.selectAll("rect")
            .filter(d => d.data.tic === 'AAPL')
            .style("opacity", 1);
    selectedBars = { tic: 'AAPL' };
    document.getElementById('tic-title').innerHTML = 'AAPL Time-Series';

    let cur_account = d3.select("#selectAccounts").node().value;
    d3.select('#selectAccounts').on('change', updateLine(cur_tic));
});
