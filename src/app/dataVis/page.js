'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/ThemeContext'; // Import theme context
const d3 = await import('d3');
import "@/styles/globals.css";
import TrendAna from './TrendAnaIndex';
import TimeDis from './TimeDis';
import SolveDen from './SolveDen';

export default function DataDashboard() {
    const [solves, setSolves] = useState([]);
    const [activeTab, setActiveTab] = useState('chart');
    const { theme } = useTheme();
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState('');

    useEffect(() => {
        fetch('/api/sessions?getAllSessions=true')
            .then(response => response.json())
            .then(data => {
                console.log("API Response:", data); // 🔍 Debugging
                if (data.sessionResults === "Session found" && Array.isArray(data.session)) {
                    setSessions(data.session);
                    if (data.session.length > 0) {
                        setSelectedSession(data.session[0].sessionName);
                    }
                } else {
                    console.warn("No sessions found or incorrect format.");
                }
            })
            .catch(error => console.error('Error fetching sessions:', error));
    }, []);

    useEffect(() => {
        if (!selectedSession) return; // Don't fetch if no session is selected

        fetch(`/api/sessions?getAllSessions=true`)
            .then(response => response.json())
            .then(data => {
                if (data.sessionResults === "Session found" && Array.isArray(data.session)) {
                    const foundSession = data.session.find(s => s.sessionName === selectedSession);
                    if (foundSession) {
                        console.log("🟢 Selected Session Data (Raw):", foundSession.timerData);

                        // ✅ Process solves to handle +2 and DNF
                        const processedSolves = foundSession.timerData.map((solve, index) => {
                            console.log(`🔍 Processing Solve #${index + 1}:`, solve);

                            let adjustedTime = solve.time;

                            if (solve.status === "+2") {
                                console.log(`✅ Solve #${index + 1} has +2 penalty (Original Time: ${solve.time})`);
                                adjustedTime += 2000; // Convert +2 to milliseconds
                            } else if (solve.status === "DNF") {
                                console.log(`🚨 Solve #${index + 1} is a DNF (Original Time: ${solve.time})`);
                                adjustedTime = null; // Represent DNF as null
                            } else {
                                console.log(`ℹ️ Solve #${index + 1} has no penalty (Status: ${solve.status})`);
                            }

                            console.log(`🕒 Adjusted Time for Solve #${index + 1}:`, adjustedTime);

                            return {
                                ...solve,
                                adjustedTime,  // ✅ Store the corrected time
                                penalty: solve.status  // ✅ Keep the original status
                            };
                        });

                        console.log("🔵 Processed Solves:", processedSolves);

                        setSolves(processedSolves); // ✅ Store processed solves
                    } else {
                        console.warn("⚠️ Selected session not found in API response.");
                        setSolves([]);
                    }
                } else {
                    setSolves([]);
                }
            })
            .catch(error => console.error('❌ Error fetching session data:', error));
    }, [selectedSession]); // 🔥 Fetch data when session changes // 🔥 Fetch data when session changes // 🔥 Fetch data when session changes // 🔥 Refetch when session changes // 🔥 Fetch data when session changes

    return (
        <div className="max-h-screen max-w-screen transition-colors duration-300"
             data-theme={theme}>

            {/* Navigation Tabs */}
            <div className="bg-primary text-text flex justify-center space-x-6 p-2">
                {/* 🔹 Session Selection Dropdown */}
                <select
                    className="px-4 py-2 border rounded bg-background text-text"
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                >
                    {sessions.length === 0 ? (
                        <option disabled>No Sessions Found</option>
                    ) : (
                        sessions.map(session => (
                            <option key={session.sessionName} value={session.sessionName}>
                                {session.sessionName}
                            </option>
                        ))
                    )}
                </select>
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
                {activeTab === 'chart' && <TrendAna solves={solves.filter(s => s.adjustedTime !== null)}/>}
                {activeTab === 'histogram' && <TimeDis solves={solves.filter(s => s.adjustedTime !== null)}/>}
                {activeTab === 'density' && <SolveDen solves={solves.filter(s => s.adjustedTime !== null)}/>}
            </div>
        </div>
    );
}