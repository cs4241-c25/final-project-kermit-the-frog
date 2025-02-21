'use client';

import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import Link from 'next/link';
import './../globals.css';

export default function DataDashboard() {
    const [solves, setSolves] = useState([]);

    useEffect(() => {
        fetch('/api/data')
            .then((response) => response.json())
            .then((data) => {
                setSolves(data.solves);
                drawCharts(data.solves);
            })
            .catch((error) => console.error('Error fetching data:', error));
    }, []);

    function drawCharts(data) {
        if (!data.length) return;

        // Prepare Data
        const times = data.map((solve) => solve.time / 1000);
        const timestamps = data.map((solve) => new Date(solve.timestamp));

        // Solve Time Trend
        drawLineChart(timestamps, times, '#solveTimeTrend', 'Solve Time Trend');

        // Histogram for Solve Times
        drawHistogram(times, '#timeDistribution', 'Solve Time Distribution');
    }

    function drawLineChart(xData, yData, container, title) {
        const width = 500, height = 300;
        d3.select(container).selectAll('*').remove();
        const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);

        const xScale = d3.scaleTime().domain(d3.extent(xData)).range([50, width - 50]);
        const yScale = d3.scaleLinear().domain([d3.min(yData), d3.max(yData)]).range([height - 50, 50]);

        const line = d3.line().x((_, i) => xScale(xData[i])).y((_, i) => yScale(yData[i]));

        svg.append('path').datum(yData).attr('d', line).attr('stroke', 'blue').attr('fill', 'none').attr('stroke-width', 2);
        svg.append('text').attr('x', width / 2).attr('y', 20).attr('text-anchor', 'middle').text(title);
    }

    function drawHistogram(data, container, title) {
        const width = 500, height = 300;
        d3.select(container).selectAll('*').remove();
        const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);

        const xScale = d3.scaleLinear().domain([d3.min(data), d3.max(data)]).range([50, width - 50]);
        const histogram = d3.histogram().domain(xScale.domain()).thresholds(10);
        const bins = histogram(data);

        const yScale = d3.scaleLinear().domain([0, d3.max(bins, (d) => d.length)]).range([height - 50, 50]);

        svg.selectAll('rect')
            .data(bins)
            .enter()
            .append('rect')
            .attr('x', (d) => xScale(d.x0))
            .attr('y', (d) => yScale(d.length))
            .attr('width', (d) => xScale(d.x1) - xScale(d.x0) - 1)
            .attr('height', (d) => height - 50 - yScale(d.length))
            .attr('fill', 'steelblue');

        svg.append('text').attr('x', width / 2).attr('y', 20).attr('text-anchor', 'middle').text(title);
    }

    return (
        <div className="bg-gray-100 min-h-screen p-6">
            <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between">
                <Link href="/">Kermit Timer</Link>
                <Link href="/timer">Back to Timer</Link>
            </nav>

            <div className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded shadow" id="solveTimeTrend"></div>
                <div className="bg-white p-4 rounded shadow" id="timeDistribution"></div>
            </div>
        </div>
    );
}