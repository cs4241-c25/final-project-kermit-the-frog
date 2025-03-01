'use client';

import { useEffect, useRef } from 'react';
const d3 = await import('d3');

export default function SolveTimeDistribution({ solves }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current && solves.length > 0) {
            drawSolveTimeDistribution(solves);
            window.addEventListener('resize', handleResize);
        }

        return () => window.removeEventListener('resize', handleResize);
    }, [solves]);

    function handleResize() {
        if (containerRef.current) {
            drawSolveTimeDistribution(solves);
        }
    }

    function drawSolveTimeDistribution(data) {
        if (!containerRef.current) return;

        const container = d3.select(containerRef.current);
        container.selectAll('*').remove();

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const svg = container.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const times = data.map((solve) => solve.time / 1000);
        const minData = Math.floor(d3.min(times) * 2) / 2;
        const maxData = Math.ceil(d3.max(times) * 2) / 2;
        const xScale = d3.scaleLinear().domain([minData, maxData]).range([50, width - 50]);
        const histogram = d3.histogram().domain(xScale.domain()).thresholds(d3.range(minData, maxData, 0.5));
        const bins = histogram(times);

        const maxBinCount = d3.max(bins, (d) => d.length);
        const yScale = d3.scaleLinear().domain([0, maxBinCount]).range([height - 50, 50]);

        // ✅ Draw horizontal grid lines at every integer value (1, 2, 3, ..., maxBinCount)
        function drawGrid() {
            svg.append('g')
                .attr('class', 'grid')
                .selectAll('line')
                .data(d3.range(1, maxBinCount + 1, 1)) // ✅ Every integer from 1 to maxBinCount
                .enter()
                .append('line')
                .attr('x1', 50)
                .attr('x2', width - 50)
                .attr('y1', (d) => yScale(d))
                .attr('y2', (d) => yScale(d))
                .attr('stroke', '#ccc')
                .attr('stroke-dasharray', '4,4'); // Dashed lines for better visibility
        }

        drawGrid(); // ✅ Call grid function after setting the y-axis

        svg.selectAll('rect')
            .data(bins)
            .enter()
            .append('rect')
            .attr('x', (d) => xScale(d.x0))
            .attr('y', (d) => yScale(d.length))
            .attr('width', (d) => xScale(d.x1) - xScale(d.x0) - 1)
            .attr('height', (d) => height - 50 - yScale(d.length))
            .attr('fill', 'steelblue');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle');
        // .text('Solve Time Distribution');

        svg.append('g')
            .attr('transform', `translate(0, ${height - 50})`)
            .call(d3.axisBottom(xScale).tickValues(d3.range(minData, maxData + 0.5, 0.5)));

        svg.append('g')
            .attr('transform', `translate(50, 0)`)
            .call(d3.axisLeft(yScale));
    }

    return <div ref={containerRef} className="bg-white w-screen h-[calc(100vh-100px)]"></div>;
}