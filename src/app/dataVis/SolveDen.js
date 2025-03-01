'use client';

import { useEffect, useRef, useState } from 'react';
const d3 = await import('d3');

export default function SolveDensity({ solves }) {
    const containerRef = useRef(null);
    const [detail, setDetail] = useState(20);  // Controls bandwidth
    const [trim, setTrim] = useState(0);  // Controls x-axis range trim
    const [densityData, setDensityData] = useState([]);

    useEffect(() => {
        if (solves.length > 0) {
            const times = solves.map((solve) => solve.time / 1000).sort((a, b) => a - b);
            const bandwidth = ((d3.max(times) - d3.min(times)) / detail) * 1.2; // Slightly increased smoothing
            const computedDensityData = kde(times, bandwidth);
            setDensityData(computedDensityData);

            drawSolveDensity(solves, computedDensityData);
            window.addEventListener('resize', handleResize);
        }
        return () => window.removeEventListener('resize', handleResize);
    }, [solves, detail, trim]);

    function handleResize() {
        if (containerRef.current) {
            drawSolveDensity(solves);
        }
    }

    function drawSolveDensity(data) {
        if (!containerRef.current) return; // Ensure containerRef is available

        const container = d3.select(containerRef.current);
        container.selectAll('*').remove(); // Clear previous SVG

        // Get dynamic width and height
        const width = containerRef.current.clientWidth || 800;
        const height = containerRef.current.clientHeight || 500;

        const svg = container.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const times = data.map((solve) => solve.time / 1000).sort((a, b) => a - b);
        const ao5 = computeRollingAverage(times, 5);
        const ao12 = computeRollingAverage(times, 12);
        const bandwidth = (d3.max(times) - d3.min(times)) / detail;

        const densityData = kde(times, bandwidth);
        const densityAo5 = kde(ao5.filter(d => d !== null), bandwidth);
        const densityAo12 = kde(ao12.filter(d => d !== null), bandwidth);

        const xDomain = d3.extent(densityData, d => d[0]);
        const maxTrim = xDomain[1] - xDomain[0] - 1;
        const adjustedTrim = Math.min(trim, maxTrim);
        const trimmedDomain = [xDomain[0], xDomain[1] - adjustedTrim];
        const xScale = d3.scaleLinear().domain(trimmedDomain).range([50, width - 50]);
        const yScale = d3.scaleLinear().domain([0, d3.max([...densityData, ...densityAo5, ...densityAo12], d => d[1])]).range([height - 50, 50]);

        const area = d3.area()
            .curve(d3.curveBasis) // Apply smoothing
            .x(d => xScale(d[0]))
            .y0(height - 50)
            .y1(d => yScale(d[1]));
        const line = d3.line()
            .curve(d3.curveBasis) // Smooths the line
            .x(d => xScale(d[0]))
            .y(d => yScale(d[1]));

        svg.append('path').datum(densityData).attr('d', area).attr('fill', 'steelblue').attr('opacity', 0.5);
        svg.append('path').datum(densityData).attr('d', line).attr('stroke', 'blue').attr('fill', 'none').attr('stroke-width', 2);

        svg.append('path').datum(densityAo5).attr('d', area).attr('fill', 'green').attr('opacity', 0.5);
        svg.append('path').datum(densityAo5).attr('d', line).attr('stroke', 'green').attr('fill', 'none').attr('stroke-width', 2);

        svg.append('path').datum(densityAo12).attr('d', area).attr('fill', 'red').attr('opacity', 0.5);
        svg.append('path').datum(densityAo12).attr('d', line).attr('stroke', 'red').attr('fill', 'none').attr('stroke-width', 2);

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle');
        // .text('Solve Time Density');

        svg.append('g').attr('transform', `translate(0, ${height - 50})`).call(d3.axisBottom(xScale));

        // Compute percentiles
        const computePercentiles = (data) => [0.25, 0.50, 0.75].map(p => {
            const index = Math.floor(p * data.length);
            return data[index];
        });

        const percentilesSingle = computePercentiles(times);
        const percentilesAo5 = computePercentiles(ao5.filter(d => d !== null));
        const percentilesAo12 = computePercentiles(ao12.filter(d => d !== null));

        // Draw dashed lines for all density plots
        const drawDashedLines = (percentiles, density, strokeColor) => {
            percentiles.forEach(value => {
                const yMax = yScale(density.find(d => d[0] >= value)?.[1] || 0);

                svg.append('line')
                    .attr('x1', xScale(value))
                    .attr('x2', xScale(value))
                    .attr('y1', height - 50)
                    .attr('y2', yMax)
                    .attr('stroke', strokeColor)
                    .attr('stroke-dasharray', '4,2');
            });
        };

        drawDashedLines(percentilesSingle, densityData, 'blue');
        drawDashedLines(percentilesAo5, densityAo5, 'green');
        drawDashedLines(percentilesAo12, densityAo12, 'red');

        // Add legend
        const legend = svg.append('g').attr('transform', `translate(${width - 120}, 100)`);

        const legendItems = [
            { color: 'blue', label: 'Single' },
            { color: 'green', label: 'AO5' },
            { color: 'red', label: 'AO12' }
        ];

        legendItems.forEach((item, i) => {
            legend.append('rect')
                .attr('x', 0)
                .attr('y', i * 20)
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', item.color)
                .attr('opacity', 0.5);

            legend.append('text')
                .attr('x', 20)
                .attr('y', i * 20 + 12)
                .attr('fill', 'black')
                .attr('font-size', '12px')
                .text(item.label);
        });
    }

    function computeRollingAverage(data, windowSize) {
        return data.map((_, i, arr) => {
            if (i < windowSize - 1) return null;
            const subset = arr.slice(i - windowSize + 1, i + 1);
            return subset.reduce((sum, val) => sum + val, 0) / subset.length;
        });
    }

    function kde(data, bandwidth) {
        const kernel = (u) => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
        const kernelDensityEstimator = (kernel, bandwidth, data) => {
            const xMin = d3.min(data) - bandwidth * 3;
            const xMax = d3.max(data) + bandwidth * 3;
            const xValues = d3.range(xMin, xMax, (xMax - xMin) / 300); // Increased points
            return xValues.map((x) => {
                return [x, d3.mean(data, (v) => kernel((x - v) / bandwidth)) / bandwidth];
            });
        };
        return kernelDensityEstimator(kernel, bandwidth, data);
    }

    return (
        <div className="w-screen h-[calc(100vh-100px)] bg-white relative">
            <div ref={containerRef} className="w-full h-full"></div>

            {/* Sliders for Detail and Trim */}
            <div className="absolute top-2 right-2 bg-white p-2 rounded shadow flex space-x-4">
                <label className="flex flex-col items-center">
                    <span>Detail</span>
                    <input
                        type="range"
                        min="5"
                        max="50"
                        value={detail}
                        onChange={(e) => setDetail(Number(e.target.value))}
                    />
                </label>
                <label className="flex flex-col items-center">
                    <span>Trim</span>
                    <input
                        type="range"
                        min="0"
                        max={densityData.length > 0
                            ? Math.max(1, Math.floor(d3.max(densityData, d => d[0]) - d3.min(densityData, d => d[0])))
                            : 1}
                        step="1"
                        value={trim}
                        onChange={(e) => setTrim(Math.min(Number(e.target.value), Math.floor(d3.max(densityData, d => d[0]) - d3.min(densityData, d => d[0]))))}
                    />
                </label>
            </div>
        </div>
    );
}