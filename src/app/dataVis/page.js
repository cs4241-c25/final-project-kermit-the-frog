'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/ThemeContext'; // Import the theme context
const d3 = await import('d3');
import "@/styles/globals.css";
import TrendAna from './TrendAnaTime';
import TimeDis from './TimeDis';
import SolveDen from './SolveDen';

export default function DataDashboard() {
    const [solves, setSolves] = useState([]);
    const [activeTab, setActiveTab] = useState('chart');
    const { theme } = useTheme(); // Get the active theme

    useEffect(() => {
        fetch('/api/data')
            .then((response) => response.json())
            .then((data) => setSolves(data.solves))
            .catch((error) => console.error('Error fetching data:', error));
    }, []);

    return (
        <div className="max-h-screen max-w-screen transition-colors duration-300"
             data-theme={theme} // Dynamically apply the theme
        >
            {/* Navigation Tabs */}
            <div className="bg-primary text-text flex justify-center space-x-6 p-2">
                <button
                    className={`px-4 py-2 ${activeTab === 'chart' ? 'border-b-2 border-accent font-bold' : ''}`}
                    onClick={() => setActiveTab('chart')}
                >
                    Trend Analysis
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'histogram' ? 'border-b-2 border-accent font-bold' : ''}`}
                    onClick={() => setActiveTab('histogram')}
                >
                    Time Distribution
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'density' ? 'border-b-2 border-accent font-bold' : ''}`}
                    onClick={() => setActiveTab('density')}
                >
                    Solve Density
                </button>
            </div>

            {/* Dynamic Content Based on Selected Tab */}
            <div className="flex-grow w-full h-full flex bg-background text-text">
                {activeTab === 'chart' && <TrendAna solves={solves} />}
                {activeTab === 'histogram' && <TimeDis solves={solves} />}
                {activeTab === 'density' && <SolveDen solves={solves} />}
            </div>
        </div>
    );
}