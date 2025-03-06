'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';

const d3 = await import('d3');
import TrendAnaTime from './TrendAnaTime';

export default function SolveTimeTrend({ solves }) {
    const containerRef = useRef(null);
    const { theme } = useTheme();
    const [colors, setColors] = useState(getThemeColors());

    const [showTimeView, setShowTimeView] = useState(false);

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

    useEffect(() => {
        // Function to update colors dynamically
        const updateColors = () => {
            setColors(getThemeColors());
        };

        // Apply initial colors
        updateColors();

        // Observer to detect theme changes dynamically
        const observer = new MutationObserver(updateColors);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => observer.disconnect();
    }, [theme]); // ✅ Ensures colors update when `theme` changes

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
    }, [colors]); // 🔥 Ensure colors update when `colors` change

    useEffect(() => {
        if (!solves || !Array.isArray(solves) || solves.length === 0) {
            d3.select(containerRef.current).selectAll('*').remove(); // 🔥 Clear chart immediately
            return;
        }

        if (containerRef.current) {
            d3.select(containerRef.current).selectAll('*').remove(); // 🔥 Ensure no old elements remain
            drawSolveTimeTrend(solves);
            window.addEventListener('resize', handleResize);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            d3.select(containerRef.current).selectAll('*').remove(); // 🔥 Ensure cleanup on unmount
        };
    }, [solves]);

    if (showTimeView) {
        return <TrendAnaTime solves={solves} />;
    }

    function handleResize() {
        if (containerRef.current) {
            drawSolveTimeTrend(solves);
        }
    }

    function computeRollingAverage(data, windowSize) {
        const rollingAvg = data.map((_, i, arr) => {
            if (i < windowSize - 1) return null;
            const subset = arr.slice(i - (windowSize - 1), i + 1);
            return subset.reduce((sum, val) => sum + val, 0) / subset.length;
        });

        console.log(`Window Size: ${windowSize}`);
        console.log(`Original Data Length: ${data.length}`);
        console.log(`Rolling Average (${windowSize}) Length: ${rollingAvg.length}`);
        console.log(`First Values:`, rollingAvg.slice(0, 15)); // Check first few values
        console.log(`Last Values:`, rollingAvg.slice(-15)); // Check last few values

        return rollingAvg;
    }

    function drawSolveTimeTrend(data) {
        if (!containerRef.current) return;

        const container = d3.select(containerRef.current);
        container.selectAll('*').remove();

        const width = containerRef.current.clientWidth || 800;
        const height = containerRef.current.clientHeight || 500;

        const svg = container.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const times = data.map((solve) => solve.adjustedTime / 1000);
        const ao5 = computeRollingAverage(times, 5);
        const ao12 = computeRollingAverage(times, 12);

        let xScale = d3.scaleLinear()
            .domain([0, times.length - 1])
            .range([50, width - 50]);

        let yScale = d3.scaleLinear()
            .domain([d3.max(times), d3.min(times)])  // Flip domain to match SVG coords
            .range([50, height - 50]); // Ensure bottom is lower on the screen

        const xAxis = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${height - 50})`)
            .call(d3.axisBottom(xScale));

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
            .scaleExtent([0.5, 5])
            .translateExtent([[0, 0], [width, height]])
            .on('zoom', (event) => {
                const transform = event.transform;
                const newXScale = transform.rescaleX(xScale);
                const newYScale = transform.rescaleY(yScale);

                // Update all plots
                updatePlot(newXScale, newYScale);

                // Update axes
                xAxis.call(d3.axisBottom(newXScale));
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

        function autoscale(event) {
            event.preventDefault(); // Stop default zoom behavior
            event.stopPropagation(); // Prevent further event propagation

            svg.transition()
                .duration(500)
                .call(zoom.transform, d3.zoomIdentity); // Reset to original zoom state
        }

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
                .data(ao5.map((val, i) => ({ x: i, y: val })), d => d.x); // Ensure unique key binding

            const ao12Selection = svg.selectAll('.point-ao12')
                .data(ao12.map((val, i) => ({ x: i, y: val })), d => d.x); // Ensure unique key binding

            console.log(`✔ Total AO5 Points Selected: ${ao5Selection.size()} (Expected: ${ao5.length})`);
            console.log(`✔ Total AO12 Points Selected: ${ao12Selection.size()} (Expected: ${ao12.length})`);

            if (ao5Selection.size() === 0) console.warn("⚠️ No AO5 points found in updatePlot!");
            if (ao12Selection.size() === 0) console.warn("⚠️ No AO12 points found in updatePlot!");

            // ✅ Update all AO5 points
            ao5Selection.attr('cx', d => newXScale(d.x))
                .attr('cy', d => newYScale(d.y));

            // ✅ Update all AO12 points
            ao12Selection.attr('cx', d => newXScale(d.x))
                .attr('cy', d => newYScale(d.y));

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
                .attr('cx', (_, i) => newXScale(i))
                .attr('cy', (_, i) => newYScale(times[i]))
                .attr('fill', colors.primary);

            // ✅ Update single solve line
            svg.selectAll('.line-single')
                .attr('d', d3.line()
                    .curve(d3.curveMonotoneX)
                    .x((_, i) => newXScale(i))
                    .y((_, i) => newYScale(times[i]))
                ).style('stroke', colors.primary);

            // ✅ Ensure AO5 line aligns dynamically
            svg.selectAll('.line-ao5')
                .attr('d', d3.line()
                    .curve(d3.curveMonotoneX)
                    .defined((_, i) => i >= 4 && ao5[i] !== null)
                    .x((_, i) => newXScale(i))
                    .y((_, i) => newYScale(ao5[i]))
                ).style('stroke', colors.secondary);

            // ✅ Ensure AO12 line aligns dynamically
            svg.selectAll('.line-ao12')
                .attr('d', d3.line()
                    .curve(d3.curveMonotoneX)
                    .defined((_, i) => i >= 11 && ao12[i] !== null)
                    .x((_, i) => newXScale(i))
                    .y((_, i) => newYScale(ao12[i]))
                ).style('stroke', colors.accent);
        }

        svg.append('path')
            .datum(times)
            .attr('class', 'line line-single')
            .attr('stroke', colors.primary)
            .attr('fill', 'none')
            .attr('stroke-width', 2);

        svg.append('path')
            .datum(ao5)
            .attr('class', 'line line-ao5')
            .attr('stroke', colors.secondary)
            .attr('fill', 'none')
            .attr('stroke-width', 2);

        svg.append('path')
            .datum(ao12)
            .attr('class', 'line line-ao12')
            .attr('stroke', colors.accent)
            .attr('fill', 'none')
            .attr('stroke-width', 2);

        const tooltip = d3.select(containerRef.current).append('div')
            .attr('class', 'absolute bg-white p-2 border rounded shadow text-sm')
            .style('visibility', 'hidden')
            .style('position', 'absolute')
            .style('color', '#000'); // ⬅️ Set tooltip text color to black

        function showTooltip(event, i) {
            const singleTime = times[i]?.toFixed(2);
            const ao5Time = ao5[i] !== null ? ao5[i]?.toFixed(2) : '-';
            const ao12Time = ao12[i] !== null ? ao12[i]?.toFixed(2) : '-';

            // Set tooltip content
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

            // Get tooltip dimensions
            const tooltipNode = tooltip.node();
            const tooltipWidth = tooltipNode ? tooltipNode.getBoundingClientRect().width : 0;

            // Get window dimensions
            const windowWidth = window.innerWidth;

            // Determine position: Default is to the right (12px offset)
            let tooltipX = event.pageX + 12;

            // If tooltip overflows the right edge, position it to the left
            if (tooltipX + tooltipWidth > windowWidth) {
                tooltipX = event.pageX - tooltipWidth - 12; // Move left
            }

            // Apply positioning
            tooltip.style('left', `${tooltipX}px`).style('top', `${event.pageY}px`);
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
                .on('mouseover', (event, d) => showTooltip(event, d.x))
                .on('mouseout', hideTooltip);
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
            .attr('class', 'absolute top-2 right-2 bg-white p-2 rounded shadow flex space-x-3'); // Flexbox for horizontal layout and spacing

        controls.append('button')
            .html('<img src="/dataVis-resize-scaling.svg" alt="Autoscale" width="24" height="24">')
            .style('margin', '5px') // Adds uniform spacing around buttons
            .on('click', autoscale);

        controls.append('button')
            .html('<img src="/dataVis-switch.svg" alt="Switch View" width="24" height="24">')
            .style('margin', '5px')
            .on('click', () => setShowTimeView(true));
    }

    return (
        <div
            ref={containerRef}
            className="w-screen h-[calc(100vh-152px)] relative"
            style={{ backgroundColor: `rgb(var(--background))` }} // Dynamically sets background
        ></div>
    );
}