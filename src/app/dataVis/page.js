'use client';

import { useEffect, useState } from 'react';
const d3 = await import('d3');
import Link from 'next/link';
import './../globals.css';
import TrendAna from './TrendAnaTime';
import TimeDis from './TimeDis';
import SolveDen from './SolveDen';
// import SessionHea from './SessionHea';

export default function DataDashboard() {
    const [solves, setSolves] = useState([]);
    const [activeTab, setActiveTab] = useState('chart');

    useEffect(() => {
        fetch('/api/data')
            .then((response) => response.json())
            .then((data) => setSolves(data.solves))
            .catch((error) => console.error('Error fetching data:', error));
    }, []);

    return (
        <div className="bg-gray-100 max-h-screen max-w-screen">
            <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between">
                <Link href="/">Kermit Timer</Link>
                <Link href="/timer">Back to Timer</Link>
            </nav>

            {/* Navigation Tabs */}
            <div className="bg-blue-500 text-white flex justify-center space-x-6 p-2">
                <button
                    className={`px-4 py-2 ${activeTab === 'chart' ? 'border-b-2 border-white font-bold' : ''}`}
                    onClick={() => setActiveTab('chart')}
                >
                    Trend Analysis
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'histogram' ? 'border-b-2 border-white font-bold' : ''}`}
                    onClick={() => setActiveTab('histogram')}
                >
                    Time Distribution
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'density' ? 'border-b-2 border-white font-bold' : ''}`}
                    onClick={() => setActiveTab('density')}
                >
                    Solve Density
                </button>
                {/*<button*/}
                {/*    className={`px-4 py-2 ${activeTab === 'heatmap' ? 'border-b-2 border-white font-bold' : ''}`}*/}
                {/*    onClick={() => setActiveTab('heatmap')}*/}
                {/*>*/}
                {/*    Session Heatmap*/}
                {/*</button>*/}
            </div>

            {/* Dynamic Content Based on Selected Tab */}
            <div className="flex-grow w-full h-full flex">
                {activeTab === 'chart' && <TrendAna solves={solves}/>}
                {activeTab === 'histogram' && <TimeDis solves={solves} />}
                {activeTab === 'density' && <SolveDen solves={solves} />}
                {/*{activeTab === 'heatmap' && <SessionHea solves={solves} />}*/}
            </div>
        </div>
    );
}
