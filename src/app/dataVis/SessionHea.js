'use client';

import { useEffect, useRef } from 'react';
const d3 = await import('d3');

export default function SessionHea({ solves }) {
    const heatmapRef = useRef(null);

    useEffect(() => {
        if (solves.length === 0) return;
        drawHeatmap(solves);
    }, [solves]);

    function drawHeatmap(data) {
        d3.select(heatmapRef.current).selectAll('*').remove();

        // Prepare data: Count solves per day-hour
        const parseDate = d3.timeFormat('%Y-%m-%d');
        const parseHour = d3.timeFormat('%H');

        const counts = d3.rollup(
            data,
            v => v.length,
            d => parseDate(new Date(d.timestamp)),
            d => parseHour(new Date(d.timestamp))
        );

        const heatmapData = [];
        counts.forEach((hours, date) => {
            hours.forEach((count, hour) => {
                heatmapData.push({ date, hour, count });
            });
        });

        console.log("Processed Heatmap Data:", heatmapData); // Debugging log

        // Define dimensions
        const width = 800, height = 400, gridSize = 25;

        const xScale = d3.scaleBand()
            .domain([...new Set(heatmapData.map(d => d.hour))])
            .range([50, width - 50])
            .padding(0.05);

        const yScale = d3.scaleBand()
            .domain([...new Set(heatmapData.map(d => d.date))])
            .range([50, height - 50])
            .padding(0.05);

        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, d3.max(heatmapData, d => d.count)]);

        const svg = d3.select(heatmapRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        svg.selectAll('rect')
            .data(heatmapData)
            .enter().append('rect')
            .attr('x', d => xScale(d.hour))
            .attr('y', d => yScale(d.date))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d.count));

        // Add X and Y Axes
        svg.append('g')
            .attr('transform', `translate(0, ${height - 50})`)
            .call(d3.axisBottom(xScale).tickFormat(d => `${d}:00`));

        svg.append('g')
            .attr('transform', `translate(50, 0)`)
            .call(d3.axisLeft(yScale));
    }

    return <div ref={heatmapRef} className="bg-white w-screen h-screen"></div>;
}
