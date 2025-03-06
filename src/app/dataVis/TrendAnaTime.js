'use client';

import { useEffect, useRef, useState } from 'react';
import TrendAnaIndex from './TrendAnaIndex';
import { useTheme } from '@/lib/ThemeContext';
const d3 = await import('d3');

export default function SolveTimeTrend({ solves }) {
    const containerRef = useRef(null);
    const [currentClusterIndex, setCurrentClusterIndex] = useState(0);
    const [clusters, setClusters] = useState([]);
    const [xDomain, setXDomain] = useState(null);
    const xDomainRef = useRef(null);
    const { theme } = useTheme();
    const [colors, setColors] = useState(getThemeColors());

    // ✅ State to track whether we are in SolveTimeTrend or TrendAnaTime
    const [showIndexView, setShowIndexView] = useState(false);

    // ✅ Function to dynamically fetch theme colors from CSS
    function getThemeColors() {
        if (typeof window === 'undefined') {
            // Return default colors when running on the server (SSR)
            return {
                text: 'rgb(0,0,0)', // Default text color
                primary: 'rgb(130,177,255)', // Default primary color
                secondary: 'rgb(239,83,80)', // Default secondary color
                accent: 'rgb(255,235,59)' // Default accent color
            };
        }

        // If we're on the client, safely access CSS variables
        const getCSSVar = (varName) =>
            getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

        return {
            text: `rgb(${getCSSVar('--text')})`,
            primary: `rgb(${getCSSVar('--primary')})`,
            secondary: `rgb(${getCSSVar('--secondary')})`,
            accent: `rgb(${getCSSVar('--accent')})`
        };
    }

    useEffect(() => {
        d3.selectAll('.legend-text').style('fill', colors.text);
    }, [colors.text]); // 🔥 Ensure legend text updates when theme changes

    // ✅ Update colors when the theme changes
    useEffect(() => {
        const updateColors = () => {
            setColors(getThemeColors());
        };

        // Apply initial colors
        updateColors();

        // Observer to detect theme changes dynamically
        const observer = new MutationObserver(updateColors);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => observer.disconnect();
    }, [theme]);

    useEffect(() => {
        const applyThemeToChart = () => {
            d3.selectAll('.x-axis text, .y-axis text').style('fill', colors.text);
            d3.selectAll('.horizontal-grid, .vertical-grid').style('stroke', colors.text);
            d3.selectAll('.point-single').style('fill', colors.primary);
            d3.selectAll('.point-ao5').style('fill', colors.secondary);
            d3.selectAll('.point-ao12').style('fill', colors.accent);
            d3.selectAll('.line-single').style('stroke', colors.primary);
            d3.selectAll('.line-ao5').style('stroke', colors.secondary);
            d3.selectAll('.line-ao12').style('stroke', colors.accent);
        };

        applyThemeToChart();
    }, [colors]);

    useEffect(() => {
        console.log("🔄 XDomain or window size updated:", xDomain);

        if (!solves || solves.length === 0) {
            console.warn("⚠️ No solves data available!");
            return;
        }

        const container = containerRef.current;
        if (!container) {
            console.warn("⚠️ Container reference is null!");
            return;
        }

        console.log("📏 Updating chart dimensions after resize...");
        drawSolveTimeTrend(solves);
    }, [xDomain, containerRef]);  // 🔥 Ensure chart updates when xDomain or container size changes

    useEffect(() => {
        if (!solves || solves.length === 0) {
            console.warn("⚠️ No solves data available!");
            d3.select(containerRef.current).selectAll('*').remove(); // 🔥 Clear chart immediately
            setClusters([]);
            setXDomain(null);
            return;
        }

        const container = containerRef.current;
        if (!container) {
            console.warn("⚠️ Container reference is null!");
            return;
        }

        console.log("📏 Updating chart dimensions after session switch...");
        d3.select(container).selectAll('*').remove(); // 🔥 Ensure no old elements remain

        // Detect clusters before drawing
        const detectedClusters = findClusters(solves);
        setClusters(detectedClusters);

        if (detectedClusters.length > 0) {
            const firstCluster = detectedClusters[0];
            const newDomain = [
                new Date(firstCluster[0].timestamp),
                new Date(firstCluster.slice(-1)[0].timestamp)
            ];

            setXDomain(newDomain);
            xDomainRef.current = newDomain;

            console.log("✅ X-Domain initialized to first cluster:", newDomain);
        }

        drawSolveTimeTrend(solves);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            d3.select(container).selectAll('*').remove(); // 🔥 Ensure cleanup on unmount
        };
    }, [solves]);  // <-- Runs only on first load

    if (showIndexView) {
        return <TrendAnaIndex solves={solves} />;
    }

    function handleResize() {
        console.log("🔄 Handling resize...");

        if (!solves || solves.length === 0) {
            console.warn("⚠️ No solves available, skipping resize!");
            return;
        }

        let detectedClusters = clusters;

        if (clusters.length === 0) {
            console.warn("⚠️ No clusters available on resize! Refinding clusters...");
            detectedClusters = findClusters(solves);
            setClusters(detectedClusters);
        }

        if (detectedClusters.length === 0) {
            console.warn("⚠️ Still no clusters found after resize!");
            return;
        }

        const prevClusterIndex = currentClusterIndex;
        const prevXDomain = xDomainRef.current;

        console.log(`📌 Preserving Cluster Index: ${prevClusterIndex}`);
        console.log("🔍 Preserving X-Domain before resize:", prevXDomain);

        // Ensure re-renders with correct states
        setCurrentClusterIndex(prevClusterIndex);
        setXDomain(prevXDomain);
        xDomainRef.current = prevXDomain;

        // ✅ Force state updates to re-enable buttons
        setTimeout(() => {
            setClusters([...detectedClusters]);
            setXDomain([...prevXDomain]);
            setCurrentClusterIndex(prevClusterIndex);
        }, 0);

        // Redraw the chart after resize
        drawSolveTimeTrend(solves);

        console.log("✅ Resize handled, restoring states.");
    }

    function findClusters(data) {
        console.log("🔍 Running findClusters...");

        let detectedClusters = [];
        let currentCluster = [data[0]];

        for (let i = 1; i < data.length; i++) {
            if (new Date(data[i].timestamp) - new Date(data[i - 1].timestamp) > 15 * 60 * 1000) {
                if (currentCluster.length > 1) {  // ✅ Ignore clusters with a single point
                    const uniqueXValues = new Set(currentCluster.map(d => d.timestamp));
                    if (uniqueXValues.size > 1) {  // ✅ Ignore clusters with the same X-Axis value
                        detectedClusters.push(currentCluster);
                    } else {
                        console.warn("⚠️ Ignoring cluster with same X-Axis values:", currentCluster);
                    }
                }
                currentCluster = [];
            }
            currentCluster.push(data[i]);
        }

        // Check last cluster before adding it
        if (currentCluster.length > 1) {
            const uniqueXValues = new Set(currentCluster.map(d => d.timestamp));
            if (uniqueXValues.size > 1) {
                detectedClusters.push(currentCluster);
            } else {
                console.warn("⚠️ Ignoring cluster with same X-Axis values:", currentCluster);
            }
        }

        console.log("📊 Clusters identified (excluding single/same x-axis clusters):", detectedClusters.length, detectedClusters);
        return detectedClusters;
    }

    function computeRollingAverage(data, windowSize) {
        return data.map((_, i, arr) => {
            if (i < windowSize - 1) return null;  // ✅ Preserve nulls at the beginning
            const subset = arr.slice(i - (windowSize - 1), i + 1);
            return subset.reduce((sum, val) => sum + val, 0) / subset.length;
        });
    }

    function drawSolveTimeTrend(data) {
        console.log("🔍 Current X-Domain in drawSolveTimeTrend:", xDomainRef.current);
        if (!containerRef.current){
            console.warn("⚠️ Container reference is null, cannot draw!");
            return;
        }

        const container = d3.select(containerRef.current);
        container.selectAll('*').remove();

        const width = containerRef.current.clientWidth || 800;
        const height = containerRef.current.clientHeight || 500;

        console.log("📏 Chart dimensions:", width, height);

        const svg = container.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // Ensure all data contains timestamps
        const processedData = data
            .map(solve => {
                if (!solve.timestamp) {
                    console.warn("⚠️ Skipping entry with missing timestamp:", solve);
                    return null;
                }
                return {
                    timestamp: new Date(solve.timestamp),
                    time: solve.adjustedTime / 1000
                };
            })
            .filter(d => d !== null);  // Remove invalid entries

        const timestamps = processedData.map(d => d.timestamp);
        const times = processedData.map(d => d.time);

        console.log("Processed timestamps:", timestamps);

        // 🔥 Find the first "cluster" (a short interval of data)
        let clusterStartIndex = 0;
        let clusterEndIndex = timestamps.length - 1;

        for (let i = 1; i < timestamps.length; i++) {
            if (timestamps[i] - timestamps[0] > 15 * 60 * 1000) { // 15-minute window
                clusterEndIndex = i;
                break;
            }
        }

        // Extract the cluster time range
        const initialXDomain = [
            timestamps[clusterStartIndex],
            timestamps[clusterEndIndex]
        ];

        console.log(`⏳ Initial Focus X Domain: ${initialXDomain[0]} to ${initialXDomain[1]}`);

        const ao5 = computeRollingAverage(times, 5);
        const ao12 = computeRollingAverage(times, 12);

        const ao5Data = timestamps.map((timestamp, i) => ({
            timestamp: timestamp,
            value: ao5[i] !== null ? ao5[i] : null
        })).filter(d => d.value !== null); // Remove initial nulls

        const ao12Data = timestamps.map((timestamp, i) => ({
            timestamp: timestamp,
            value: ao12[i] !== null ? ao12[i] : null
        })).filter(d => d.value !== null); // Remove initial nulls

        // X Scale: Start zoomed into the identified cluster
        let xScale = d3.scaleTime()
            .domain(xDomainRef.current ?? [timestamps[0], timestamps[timestamps.length - 1]])  // ✅ Use ref as fallback
            .range([50, width - 50]);

        console.log("📉 Applying X Scale domain in drawSolveTimeTrend:", xScale.domain());
        console.log("xScale range:", xScale.range());

        const yScale = d3.scaleLinear()
            .domain([d3.max(times), d3.min(times)])
            .range([50, height - 50]);

        // Add X and Y axes
        const xAxis = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${height - 50})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%H:%M:%S')));

        // Filter unique days for displaying date below
        let lastDate = null;
        xAxis.selectAll('text')
            .attr('dy', '1.2em') // Move time labels up slightly
            .each(function(d, i, nodes) {
                const currentText = d3.select(this);
                const dateStr = d3.timeFormat('%b %d, %Y')(new Date(d));
                if (dateStr !== lastDate) {
                    currentText.append('tspan')
                        .attr('x', 0)
                        .attr('dy', '1.2em')
                        .text(dateStr);
                    lastDate = dateStr;
                }
            });

        const yAxis = svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(50, 0)`)
            .call(d3.axisLeft(yScale));

        const gridGroup = svg.append('g').attr('class', 'grid');

        function drawGrid(xScale, yScale) {
            gridGroup.selectAll('*').remove();

            // Horizontal grid lines
            gridGroup.selectAll('.horizontal-grid')
                .data(yScale.ticks(10))
                .enter()
                .append('line')
                .attr('class', 'horizontal-grid')
                .attr('x1', 50)
                .attr('x2', width - 50)
                .attr('y1', d => yScale(d))
                .attr('y2', d => yScale(d))
                .attr('stroke', getThemeColors().text)
                .attr('stroke-dasharray', '4,4');

            // Vertical grid lines
            gridGroup.selectAll('.vertical-grid')
                .data(xScale.ticks(10))
                .enter()
                .append('line')
                .attr('class', 'vertical-grid')
                .attr('x1', d => xScale(d))
                .attr('x2', d => xScale(d))
                .attr('y1', 50)
                .attr('y2', height - 50)
                .attr('stroke', getThemeColors().text)
                .attr('stroke-dasharray', '4,4');
        }

        drawGrid(xScale, yScale);

        const zoom = d3.zoom()
            // .scaleExtent([0.5, 5])
            // .translateExtent([[0, 0], [width, height]])
            .on('zoom', (event) => {
                const transform = event.transform;
                const newXScale = transform.rescaleX(xScale);
                const newYScale = transform.rescaleY(yScale);

                console.log("Updated xScale domain:", newXScale.domain());

                // Update all plots
                updatePlot(newXScale, newYScale);

                // Update axes
                xAxis.call(d3.axisBottom(newXScale).tickFormat(d3.timeFormat('%H:%M:%S')));

                let lastZoomDate = null;
                xAxis.selectAll('text')
                    .attr('dy', '1.2em')
                    .each(function(d, i, nodes) {
                        const currentText = d3.select(this);
                        const dateStr = d3.timeFormat('%b %d, %Y')(new Date(d));
                        if (dateStr !== lastZoomDate) {
                            currentText.append('tspan')
                                .attr('x', 0)
                                .attr('dy', '1.2em')
                                .text(dateStr);
                            lastZoomDate = dateStr;
                        }
                    });
                yAxis.call(d3.axisLeft(newYScale));

                d3.selectAll('.horizontal-grid').attr('stroke', colors.text)
                d3.selectAll('.vertical-grid').attr('stroke', colors.text)
                // Update grid with new scales
                drawGrid(newXScale, newYScale);
            });

        svg.call(zoom);

        // ✅ Add Legends (Below Autoscale Button)
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 120}, 100)`);

        const legendItems = [
            { color: colors.primary, label: 'Single' },
            { color: colors.secondary, label: 'AO5' },
            { color: colors.accent, label: 'AO12' }
        ];

        legendItems.forEach((item, i) => {
            legend.append('rect')
                .attr('x', 0)
                .attr('y', i * 20)
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', item.color);

            legend.append('text')
                .attr('class', 'legend-text') // ✅ Ensures we can update it dynamically
                .attr('x', 20)
                .attr('y', i * 20 + 12)
                .attr('fill', colors.text) // ✅ Initially set to correct color
                .attr('font-size', '12px')
                .text(item.label);
        });

// Ensure event is passed to autoscale
        svg.on('dblclick', (event) => autoscale(event));

// Also explicitly disable zoom on double-click to prevent zooming in
        svg.call(zoom).on("dblclick.zoom", null);

        function updatePlot(newXScale, newYScale) {
            console.log("🔄 Updating Plot with New Scales:");
            console.log("🟢 New X Scale Domain:", newXScale.domain());
            console.log("🟢 New Y Scale Domain:", newYScale.domain());

            // ✅ Ensure that the AO5 and AO12 points are correctly bound
            const ao5Selection = svg.selectAll('.point-ao5')
                .data(ao5Data, d => d.timestamp)
                .join('circle')
                .attr('class', 'point-ao5')
                .attr('cx', d => xScale(new Date(d.timestamp)))  // Align with timestamps
                .attr('cy', d => yScale(d.value))
                .attr('r', 5)
                .attr('fill', colors.secondary)
                .on("mouseover", (event, d) => showTooltip(event, d.timestamp))
                .on("mouseout", () => tooltip.style("visibility", "hidden"));

            const ao12Selection = svg.selectAll('.point-ao12')
                .data(ao12Data, d => d.timestamp)
                .join('circle')
                .attr('class', 'point-ao12')
                .attr('cx', d => xScale(new Date(d.timestamp)))  // Align with timestamps
                .attr('cy', d => yScale(d.value))
                .attr('r', 5)
                .attr('fill', colors.accent)
                .on("mouseover", (event, d) => showTooltip(event, d.timestamp))
                .on("mouseout", () => tooltip.style("visibility", "hidden"));

            console.log(`✔ Total AO5 Points Selected: ${ao5Selection.size()} (Expected: ${ao5.length})`);
            console.log(`✔ Total AO12 Points Selected: ${ao12Selection.size()} (Expected: ${ao12.length})`);

            if (ao5Selection.size() === 0) console.warn("⚠️ No AO5 points found in updatePlot!");
            if (ao12Selection.size() === 0) console.warn("⚠️ No AO12 points found in updatePlot!");

            // ✅ Update all AO5 points correctly
            ao5Selection.attr('cx', d => newXScale(new Date(d.timestamp)))
                .attr('cy', d => newYScale(d.value)); // ✅ Use d.value for AO5

            // ✅ Update all AO12 points correctly
            ao12Selection.attr('cx', d => newXScale(new Date(d.timestamp)))
                .attr('cy', d => newYScale(d.value)); // ✅ Use d.value for AO12

            // ✅ Debugging: Ensure last AO5 & AO12 points update correctly
            ao5Selection.each(function (d, i) {
                if (i >= ao5.length - 4) { // Use `ao5.length` to correctly iterate
                    console.log(`🟢 AO5 Point ${i}: x=${newXScale(d.x)}, y=${newYScale(d.y)}`);
                }
            });

            ao12Selection.each(function (d, i) {
                if (i >= ao12.length - 12) { // Use `ao12.length` to correctly iterate
                    console.log(`🔴 AO12 Point ${i}: x=${newXScale(d.x)}, y=${newYScale(d.y)}`);
                }
            });

            // ✅ Update single solve points
            svg.selectAll('.point-single')
                .data(processedData, d => d.timestamp)
                .join('circle')
                .attr('class', 'point-single')
                .attr('cx', d => newXScale(new Date(d.timestamp))) // FIX: Use newXScale
                .attr('cy', d => newYScale(d.time)) // FIX: Use newYScale
                .attr('r', 5)
                .attr('fill', colors.primary)
                .on("mouseover", (event, d) => showTooltip(event, d.timestamp))
                .on("mouseout", () => tooltip.style("visibility", "hidden"));

            // ✅ Update single solve line
            svg.selectAll('.line-single')
                .attr('d', d3.line()
                    .curve(d3.curveMonotoneX)
                    .x(d => newXScale(new Date(d.timestamp)))
                    .y(d => newYScale(d.time))
                );

            // ✅ Ensure AO5 line aligns dynamically
            svg.selectAll('.line-ao5')
                .datum(ao5.map((val, i) => ({ timestamp: timestamps[i], value: val })))
                .attr('d', d3.line()
                    .curve(d3.curveMonotoneX)
                    .defined(d => d.value !== null)
                    .x(d => newXScale(new Date(d.timestamp)))
                    .y(d => newYScale(d.value))
                );

            // ✅ Ensure AO12 line aligns dynamically
            svg.selectAll('.line-ao12')
                .datum(ao12.map((val, i) => ({ timestamp: timestamps[i], value: val })))
                .attr('d', d3.line()
                    .curve(d3.curveMonotoneX)
                    .defined(d => d.value !== null)
                    .x(d => newXScale(new Date(d.timestamp)))
                    .y(d => newYScale(d.value))
                );
        }

        svg.append('path')
            .datum(processedData)
            .attr('class', 'line-single')
            .attr('stroke', colors.primary)
            .attr('fill', 'none')
            .attr('stroke-width', 2)
            .attr('d', d3.line()
                .curve(d3.curveMonotoneX)
                .x(d => xScale(new Date(d.timestamp)))
                .y(d => yScale(d.time))
            );

        svg.selectAll('.line-ao5')
            .data([ao5])  // ✅ Use .data([]) instead of .datum()
            .join("path")
            .attr('class', 'line-ao5')
            .attr('stroke', colors.secondary)
            .attr('fill', 'none')
            .attr('stroke-width', 2)
            .attr('d', d3.line()
                .curve(d3.curveMonotoneX)
                .defined((_, i) => i >= 4 && ao5[i] !== null)
                .x((_, i) => xScale(new Date(timestamps[i])))  // ✅ Use timestamps
                .y((_, i) => yScale(ao5[i]))
            );

        svg.selectAll('.line-ao12')
            .data([ao12])  // ✅ Use .data([]) instead of .datum()
            .join("path")
            .attr('class', 'line-ao12')
            .attr('stroke', colors.accent)
            .attr('fill', 'none')
            .attr('stroke-width', 2)
            .attr('d', d3.line()
                .curve(d3.curveMonotoneX)
                .defined((_, i) => i >= 11 && ao12[i] !== null)
                .x((_, i) => xScale(new Date(timestamps[i])))  // ✅ Use timestamps
                .y((_, i) => yScale(ao12[i]))
            );

        const tooltip = d3.select(containerRef.current).append('div')
            .attr('class', 'absolute bg-white p-2 border rounded shadow text-sm')
            .style('visibility', 'hidden')
            .style('position', 'absolute')
            .style('color', '#000'); // ⬅️ Set tooltip text color to black

        function showTooltip(event, timestamp) {
            if (!timestamp) {
                console.warn("⚠️ showTooltip called with invalid timestamp:", timestamp);
                return;
            }

            // Find all data points with the same timestamp
            const singleData = processedData.find(d => d.timestamp.getTime() === timestamp.getTime());
            const ao5DataPoint = ao5Data.find(d => d.timestamp.getTime() === timestamp.getTime());
            const ao12DataPoint = ao12Data.find(d => d.timestamp.getTime() === timestamp.getTime());

            const singleTime = singleData ? singleData.time.toFixed(2) : "-";
            const ao5Time = ao5DataPoint ? ao5DataPoint.value.toFixed(2) : "-";
            const ao12Time = ao12DataPoint ? ao12DataPoint.value.toFixed(2) : "-";

            console.log(`🟢 Showing tooltip for timestamp ${timestamp}: Single=${singleTime}, AO5=${ao5Time}, AO12=${ao12Time}`);

            tooltip.html(`
                <div><strong>Single:</strong> ${singleTime}s</div>
                <div><strong>AO5:</strong> ${ao5Time}s</div>
                <div><strong>AO12:</strong> ${ao12Time}s</div>
            `)
                .style('visibility', 'visible')
                .style('position', 'fixed')
                .style('background', 'white')
                .style('padding', '6px')
                .style('border', '1px solid #ccc')
                .style('border-radius', '5px')
                .style('box-shadow', '2px 2px 10px rgba(0, 0, 0, 0.1)')
                .style('font-size', '12px')
                .style('pointer-events', 'none')
                .style('z-index', '1000')
                .style('transform', 'translate(0, -50%)');

            const tooltipWidth = tooltip.node().offsetWidth;
            const windowWidth = window.innerWidth;
            const offsetX = 12;

            const leftPosition = event.pageX + tooltipWidth + offsetX > windowWidth
                ? event.pageX - tooltipWidth - offsetX
                : event.pageX + offsetX;

            tooltip.style('left', `${leftPosition}px`).style('top', `${event.pageY}px`);
        }

        function hideTooltip() {
            tooltip.style('visibility', 'hidden');
        }

        setTimeout(() => {
            updatePlot(xScale, yScale);  // ✅ Force render after initialization
        }, 100);

        function addPoints(data, color, className, valueAccessor, minIndex, label) {
            // ✅ Ensure that we correctly iterate over the full dataset
            const validPoints = data
                .map((val, i) => ({ x: i, y: valueAccessor(i) }))
                .filter(d => d.y !== null && d.x >= minIndex); // ✅ Removed x < times.length constraint

            console.log(`\n🟢 Adding Points for ${label} | Class: ${className} | MinIndex: ${minIndex}`);
            console.log(`✔ Valid Points Count: ${validPoints.length}`);
            console.log(`📍 First 5 Points:`, validPoints.slice(0, 5));
            console.log(`📍 Last 5 Points:`, validPoints.slice(-5));

            validPoints.forEach((point, i) => {
                console.log(
                    `🔵 ${label} Point ${i + minIndex}: RawX=${point.x}, ScaledX=${xScale(point.x)}, ` +
                    `RawY=${point.y.toFixed(3)}, ScaledY=${yScale(point.y).toFixed(2)}`
                );
            });

            // Ensure data binding is done correctly
            svg.selectAll(`.${className}`)
                .data(validPoints, d => d.x) // Ensure unique key binding
                .join("circle") // Ensure proper binding
                .attr('class', `point ${className}`)
                .attr('cx', d => xScale(d.x))
                .attr('cy', d => yScale(d.y))
                .attr('r', 5)
                .attr('fill', color)
        }

// ✅ Ensure AO5 & AO12 points are fully added before updating
        addPoints(times, colors.primary, 'point-single', (i) => times[i], 0, "Single");
        addPoints(ao5, colors.secondary, 'point-ao5', (i) => ao5[i], 4, "AO5");
        addPoints(ao12, colors.accent, 'point-ao12', (i) => ao12[i], 11, "AO12");

        function showTooltip2(event, text) {
            // Remove any existing tooltips to prevent duplication
            d3.selectAll('.button-tooltip').remove();

            // Create a new tooltip
            const tooltip = d3.select('body')
                .append('div')
                .attr('class', 'button-tooltip absolute bg-black text-white text-xs px-2 py-1 rounded shadow-lg')
                .style('visibility', 'hidden')
                .style('position', 'absolute')
                .style('z-index', '1000')
                .style('white-space', 'nowrap')
                .text(text);

            // Get button position
            const buttonRect = event.target.getBoundingClientRect();
            const tooltipRect = tooltip.node().getBoundingClientRect();

            // Positioning tooltip at the bottom-left of the button
            tooltip
                .style('top', `${buttonRect.bottom + window.scrollY + 5}px`) // 5px below the button
                .style('left', `${buttonRect.left + window.scrollX - (tooltipRect.width - buttonRect.width)}px`) // Align to bottom-left
                .style('visibility', 'visible');

            // Add a global event listener to remove tooltip on click
            document.addEventListener('click', hideTooltip2, { once: true });
        }

        function hideTooltip2() {
            d3.selectAll('.button-tooltip').remove(); // Remove tooltip when mouse leaves
        }

        const controls = d3.select(containerRef.current).append('div')
            .attr('class', 'absolute top-2 right-2 bg-white p-2 rounded shadow flex space-x-4'); // Horizontal layout with spacing

// Previous Cluster Button
        controls.append('button')
            .html('<img src="/dataVis-previous.svg" alt="Previous" width="24" height="24">')
            .style('margin', '5px') // Adds spacing around the button
            .attr('disabled', clusters.length === 0 || currentClusterIndex === 0 ? 'disabled' : null)
            .on('click', prevCluster);

// Next Cluster Button
        controls.append('button')
            .html('<img src="/dataVis-next.svg" alt="Next" width="24" height="24">')
            .style('margin', '5px')
            .attr('disabled', clusters.length === 0 || currentClusterIndex >= clusters.length - 1 ? 'disabled' : null)
            .on('click', nextCluster);

// Autoscale Button
        controls.append('button')
            .html('<img src="/dataVis-resize-scaling.svg" alt="Autoscale" width="24" height="24">')
            .style('margin', '5px')
            .on('click', autoscale);

// Switch to Time View Button
        controls.append('button')
            .html('<img src="/dataVis-switch.svg" alt="Switch View" width="24" height="24">')
            .style('margin', '5px')
            .on('click', () => setShowIndexView(true));
    }

    function autoscale() {
        console.log("🔍 Autoscale triggered...");

        if (!clusters || clusters.length === 0) {
            console.warn("⚠️ No clusters available for autoscale!");
            return;
        }

        console.log("📌 Autoscaling to first cluster...");
        setCurrentClusterIndex(0);

        const firstCluster = clusters[0];

        if (!firstCluster || firstCluster.length === 0) {
            console.warn("⚠️ First cluster is empty, cannot autoscale!");
            return;
        }

        const newDomain = [
            new Date(firstCluster[0].timestamp),
            new Date(firstCluster.slice(-1)[0].timestamp)
        ];

        console.log("✅ Setting autoscale X-Domain to:", newDomain);
        setXDomain(newDomain);
        xDomainRef.current = newDomain;

        // ✅ Force React to update UI state
        setTimeout(() => {
            setClusters([...clusters]); // Force re-evaluation of clusters state
        }, 0);
    }

    function nextCluster() {
        console.log("➡️ Next cluster clicked...");
        if (currentClusterIndex < clusters.length - 1) {
            const nextIndex = currentClusterIndex + 1;
            console.log("📌 Moving to next cluster:", nextIndex);
            setCurrentClusterIndex(nextIndex);
            const newDomain = [
                new Date(clusters[nextIndex][0].timestamp),
                new Date(clusters[nextIndex].slice(-1)[0].timestamp)
            ];

            setXDomain(newDomain);
            xDomainRef.current = newDomain;
        } else {
            console.warn("⚠️ No next cluster available!");
        }
    }

    function prevCluster() {
        console.log("⬅️ Previous cluster clicked...");
        if (currentClusterIndex > 0) {
            const prevIndex = currentClusterIndex - 1;
            console.log("📌 Moving to previous cluster:", prevIndex);
            setCurrentClusterIndex(prevIndex);
            const newDomain = [
                new Date(clusters[prevIndex][0].timestamp),
                new Date(clusters[prevIndex].slice(-1)[0].timestamp)
            ];

            setXDomain(newDomain);
            xDomainRef.current = newDomain;
        } else {
            console.warn("⚠️ No previous cluster available!");
        }
    }

    // return (
    //     <div className="w-screen h-[calc(100vh-100px)] bg-white relative">
    //         {/* ✅ Chart container */}
    //         <div ref={containerRef} className="w-full h-full"></div>
    //
    //         {/* ✅ Controls Section */}
    //         <div className="absolute top-2 right-2 bg-white p-2 rounded shadow flex space-x-2">
    //             <button
    //                 className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
    //                 disabled={clusters.length === 0 || currentClusterIndex === 0}
    //                 onClick={() => prevCluster()}
    //             >
    //                 Previous Cluster
    //             </button>
    //
    //             <button
    //                 className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
    //                 disabled={clusters.length === 0 || currentClusterIndex >= clusters.length - 1}
    //                 onClick={() => nextCluster()}
    //             >
    //                 Next Cluster
    //             </button>
    //
    //             <button
    //                 className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
    //                 onClick={() => autoscale()}
    //             >
    //                 Autoscale
    //             </button>
    //
    //             {/* ✅ Switch button to go to TrendAnaTime.js */}
    //             <button
    //                 className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
    //                 onClick={() => setShowIndexView(true)}
    //             >
    //                 Switch to Time View
    //             </button>
    //         </div>
    //     </div>
    // );

    return (
        <div
            ref={containerRef}
            className="w-screen h-[calc(100vh-152px)] relative"
            style={{ backgroundColor: colors.background }} // ✅ Background dynamically updates
        ></div>
    );
}