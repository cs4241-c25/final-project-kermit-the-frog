'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Modal from "@/app/dashboard/timer/Modal";

export default function Timer() {
    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;

    let upTriggered = false;
    let downTriggered = false;

    let running = false;
    let ready = false;
    let pressed = false;

    let startTimeoutTime = 0;
    let elapsedTimeoutTime = 0;
    let timerTimeoutInterval = null;
    let runningTimeout = false;

    const TIMEOUT = 200;

    const router = useRouter();
    const [error, setError] = useState('');
    const [updateData, setUpdateData] = useState([]); //Update when any data is changed
    const session = useSession();
    const [dropDown, setDropDown] = useState({}); //Keep a object for each dropdown so multiple can be toggled at once
    const [timerColor, setTimerColor] = useState("text-text"); //state to track color during presses

    /* Current Session Object to allow direct access to the array*/
    const [currentSession, setCurrentSession] = useState(null);
    const [selectedSession, setSelectedSession] = useState("3x3");
    const [openAddSession, setOpenAddSession] = useState(false);
    const [newSessionCreated, setNewSessionCreated] = useState(false);

    /* Video-related state and refs */
    const [videoMode, setVideoMode] = useState(false);
    const [cameraPermission, setCameraPermission] = useState(null);
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);


    /* State Handling Key Presses & Timer */
    /*
    const [currentTime, setCurrentTime] = useState(0); //Update for timer start
    const [pressedSpace, setPressedSpace] = useState(false); //While space bar is pressed, set state
    const [readyTimer, setReadyTimer] = useState(false); // while primed, set to ready
    const [runningTimer, setRunningTimer] = useState(false); // set state while running timer
    const [displayedTime, setDisplayedTime] = useState("0.000");
    const [timerStartTime, setTimerStartTime] = useState(0);
    */

    // State for tracking expanded/collapsed state
    const [expandedPreview, setExpandedPreview] = useState(false);

    useEffect(() => {
        if (session.status === "authenticated") {
            router.push('/dashboard/timer');
        }
    }, [session.status, router]);


    useEffect(() => {
        document.addEventListener("keydown", keyDownHandler);
        document.addEventListener("keyup", keyUpHandler);

        return () => {
            document.removeEventListener("keydown", keyDownHandler);
            document.removeEventListener("keyup", keyUpHandler);
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            await updateTable()
        }
        fetchData();
    }, []);

    useEffect(() => {
        if(currentSession !== null && selectedSession !== null)  {setCurrentSession(getSession( selectedSession));}
    },[selectedSession]);

    /* Runs once when the page loads to set the default Session */
    useEffect(() => {
        setCurrentSession(getSession('3x3'));
    },[])


    function updateTimerColor() {
        if (running) {
            setTimerColor("text-text");
        } else if (ready) {
            setTimerColor("text-green-500");
        } else if (pressed) {
            setTimerColor("text-red-500");
        } else {
            setTimerColor("text-text");
        }
    }

    function keyDownHandler(event) {
        upTriggered = false;
        if (event.code === "Space") {
            pressed = true;
            updateTimerColor();
        }
        if (!downTriggered) {
            downTriggered = true;
            updateTimerColor();
            if (running) {
                stopTimer();
            } else if (event.code === "Space") {
                startTimeoutTimer();
            }
        }
    }

    function keyUpHandler(event) {
        downTriggered = false;
        if (event.code === "Space") {
            pressed = false;
            updateTimerColor();
        }
        if (!upTriggered) {
            upTriggered = true;
            if (event.code === "Space" && ready) {
                startTimer();
                stopTimeoutTimer();
            } else if (event.code === "Space" && !ready) {
                stopTimeoutTimer();
            }
        }
    }

    function startTimer() {
        clearInterval(timerInterval);
        startTime = Date.now();
        timerInterval = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            document.getElementById("timer").innerText = (elapsedTime / 1000).toFixed(3);
        }, 10);
        running = true;
        ready = false;
        updateTimerColor();

        // Start recording if video mode is on
        startRecording();
    }

    function stopTimer() {
        clearInterval(timerInterval);
        running = false;
        updateTimerColor();
        addTimeToDB(elapsedTime, Date.now());

        // Stop recording if video mode is on
        stopRecording();
    }

    function startTimeoutTimer() {
        startTimeoutTime = Date.now();
        runningTimeout = true;
        timerTimeoutInterval = setInterval(() => {
            elapsedTimeoutTime = Date.now() - startTimeoutTime;
            if (elapsedTimeoutTime > TIMEOUT) {
                ready = true;
                stopTimeoutTimer();
                updateTimerColor();
            }
        }, 10);
    }

    function stopTimeoutTimer() {
        clearInterval(timerTimeoutInterval);
        runningTimeout = false;
    }

    /*
        Need to change how data is added to Database with the newly created Session
     */
    async function addTimeToDB(time, timestamp) {
        try {
            const data = {time: time, timestamp: timestamp};
            const response = await fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            await response.json()
            await updateTable()
        } catch (err) {
            console.error(' addTimeToDB Error:', error);
            alert("Error: Unauthorized, please restart your browser");
        }
    }

    async function handleDelete(id) {
        try {
            const response = await fetch('/api/delete', {
                method: 'DELETE', //change to DELETE
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({id}),
            })
            await response.json;
            //use Remove the data from data List, will rerender w/o the given id element
            setUpdateData(prev => prev.filter(solve => solve._id !== id));
        } catch (error) {
            console.error('Delete Error:', error);
        }
    }

    async function handleStatusChange(id, status) {
        try {
            const response = await fetch('/api/updateSolve', {
                method: 'POST', //can be changes to GET
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({id, status}),
            })
            await response.json;
            //use state to change the status by making sure state is updated before the call
            setUpdateData(prev => prev.filter(solve => solve._id !== id));
            await updateTable();
        } catch (error) {
            console.error('Status Change Error:', error);
        }
    }

    /* Use GET function in Data, update is redundant */
    async function updateTable() {
        try {
            const response = await fetch('/api/data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            const result = await response.json()
            if (result.solves.length > 0) {
                result.solves.sort((a, b) => b.timestamp - a.timestamp);
                setUpdateData(result.solves)
            }
        } catch (error) {
            console.error('UpdateTable Error:', error);
            alert("Error: Unauthorized, please restart your browser");
        }
    }
    /* Keep state of other dropdown and only change for ID dropdown */
    function toggleDropDown(id) {
        setDropDown(prev => ({...prev, [id]: !prev[id]}));

    }

    /**
     * Creates a sessions with the provided name for the user, and adds a row in the Sessions table with Schema
     * {MongoID, UserID, SessionName, timeData[]}
     * @returns {Promise<void>}
     */
    async function createSession(sessionName, isThreeByThree){
        try{
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({sessionName: sessionName, isThreeByThree: isThreeByThree}),
            })
            if(response.ok){
                setNewSessionCreated(true)
                setSelectedSession(sessionName)
            }
        } catch (error) {
            console.error(' createSession Error:', error);
        }
    }

    async function getSession(sessionName){
        try{
            const response = await fetch(`/api/sessions?sessionName=${sessionName}`, {
                method: 'GET'
            })
            if(response.ok) {
                return response.json();
            }
        } catch (error) {
            console.error('Error fetching user sessions: ', error);
        }
    }

    function createTimeData(solve) {
        /*
        Creates a List for each time again,
         */
        let time = (solve.time / 1000).toFixed(3);
        if (solve.status === "DNF") time = "DNF"
        else if (solve.status === '+2') time = `${(Number(time) + 2).toFixed(3)}+`

        return (
            <li key={solve._id}>
                <button
                    className={`w-full text-center px-2 py-1 hover:bg-secondary/20 
                        ${dropDown[solve._id] 
                            ? 'bg-secondary/20 rounded-t-2xl hover:bg-accent/10' 
                            : 'rounded-2xl hover:bg-accent/10'
                        } 
                        flex items-center justify-center gap-2 transition-all duration-200`}
                    onClick={() => toggleDropDown(solve._id)}
                >
                    <span>{time}</span>
                    <svg
                        className={`w-4 h-4 transition-transform duration-300 ${dropDown[solve._id] ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out rounded-b-2xl
                        ${dropDown[solve._id] ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <div className="bg-secondary/20 flex flex-col gap-1 rounded-b-2xl transform transition-transform duration-200">
                        <button className="hover:bg-accent/10 px-2 py-1"
                            onClick={() => handleStatusChange(solve._id, "OK").then(() => toggleDropDown(solve._id))}
                        >
                            OK
                        </button>
                        <button className="hover:bg-accent/10 px-2 py-1"
                            onClick={() => handleStatusChange(solve._id, "+2")}
                        >
                            +2
                        </button>
                        <button className="hover:bg-accent/10 px-2 py-1"
                            onClick={() => handleStatusChange(solve._id, "DNF")}
                        >
                            DNF
                        </button>
                        <button className="hover:bg-accent/10 px-2 py-1 rounded-b-2xl text-red-400"
                            onClick={() => handleDelete(solve._id)}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </li>
        )
    }

    // First, let's modify the toggleVideoMode function to be more robust
    const toggleVideoMode = async () => {
        try {
            console.log("Toggle video mode clicked, current state:", videoMode);

            if (!videoMode) {
                console.log("Attempting to access camera...");

                // Check if browser supports getUserMedia
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("Your browser doesn't support camera access");
                }

                // First set videoMode to true so the video element renders
                setVideoMode(true);

                // Wait a moment for the video element to be created in the DOM
                setTimeout(async () => {
                    try {
                        if (!videoRef.current) {
                            console.error("Video element still not available after delay");
                            throw new Error("Video element not available");
                        }

                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: true,
                            audio: false
                        });

                        console.log("Camera access granted, setting up video preview");
                        videoRef.current.srcObject = stream;
                        setCameraPermission('granted');
                    } catch (innerErr) {
                        console.error("Error accessing camera after delay:", innerErr);
                        setCameraPermission('denied');
                        setVideoMode(false);
                        alert(`Camera error: ${innerErr.message}`);
                    }
                }, 100); // Short delay to ensure DOM is updated

            } else {
                console.log("Turning off video mode, stopping camera");

                // Stop the camera when turning off video mode
                if (videoRef.current && videoRef.current.srcObject) {
                    const tracks = videoRef.current.srcObject.getTracks();
                    tracks.forEach(track => {
                        console.log("Stopping track:", track.kind);
                        track.stop();
                    });
                    videoRef.current.srcObject = null;
                }
                setVideoMode(false);
            }
        } catch (err) {
            console.error("Error in toggleVideoMode:", err);
            setCameraPermission('denied');
            alert(`Camera error: ${err.message || "Could not access camera. Please check your browser permissions."}`);
            setVideoMode(false);
        }
    };

    // Start recording when timer starts
    const startRecording = () => {
        if (videoMode && videoRef.current && videoRef.current.srcObject) {
            recordedChunksRef.current = [];
            const stream = videoRef.current.srcObject;
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);

                // Create download link for the recorded video
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `solve-${new Date().toISOString()}.webm`;
                document.body.appendChild(a);
                a.click();

                // Clean up
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
        }
    };

    // Stop recording when timer stops
    const stopRecording = () => {
        if (videoMode && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };



    return (
        <section className="flex h-full">
            <aside className="w-3/12 p-4 bg-primary/20 flex flex-col">
                <div className="flex flex-col items-center gap-4 lg:flex-row mb-4 h-fit justify-between">
                    <select
                        className="dropdown w-full text-xl h-12"
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                    >
                        <option value="3x3">3x3</option>
                        <option value="5x5">5x5</option>
                        {
                            newSessionCreated && (
                                <option value={selectedSession}> {selectedSession} </option>
                            )
                        }
                    </select>
                    <button
                        className="button text-xl p-0 m-0 w-full h-12 lg:aspect-square lg:size-12"
                        title="Add Custom Session"
                        onClick={() => setOpenAddSession(true)}
                    >
                        +
                    </button>
                    {
                        openAddSession && (
                            <Modal showModal={openAddSession}
                                   close={() => setOpenAddSession(false)}
                                   createSession = {createSession}
                            />
                        )
                    }
                </div>

                <h2 className="text-3xl font-bold mb-4 text-center">Times</h2>
                <ul className="space-y-2 text-2xl flex-grow overflow-y-auto">
                    {updateData.map(createTimeData)}
                </ul>

                <div className="mt-auto pt-4 border-t border-text/10">
                    <div className="flex items-center justify-between">
                        <label className="text-lg font-medium cursor-pointer" onClick={toggleVideoMode}>
                            Video Mode {videoMode ? '(On)' : '(Off)'}
                        </label>
                        <button
                            onClick={toggleVideoMode}
                            className="relative inline-block w-12 h-6 transition duration-200 ease-in-out"
                            aria-pressed={videoMode}
                            role="switch"
                        >
                            <span
                                className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${videoMode ? 'bg-accent' : 'bg-gray-400'}`}
                            >
                                <span
                                    className={`absolute h-5 w-5 left-0.5 bottom-0.5 bg-white rounded-full shadow transition-transform duration-300 ease-in-out ${videoMode ? 'transform translate-x-6' : ''}`}
                                ></span>
                            </span>
                        </button>
                    </div>

                    {/* Status message for better feedback */}
                    <div className="text-sm mt-1">
                        {videoMode && cameraPermission === 'granted' && <p className="text-green-500">Camera active</p>}
                        {videoMode && !cameraPermission && <p className="text-yellow-500">Initializing camera...</p>}
                        {cameraPermission === 'denied' && (
                            <p className="text-red-500">
                                Camera access denied. Please enable camera permissions.
                            </p>
                        )}
                    </div>

                    {/* Video preview with expand/collapse button */}
                    {videoMode && (
                        <div className="mt-2 relative">
                            <video
                                ref={videoRef}
                                className={`w-full bg-black rounded-lg object-cover transition-all duration-300 ${
                                    expandedPreview ? 'h-64' : 'h-32'
                                }`}
                                autoPlay
                                playsInline
                                muted
                            />
                            <div className="absolute bottom-2 right-2 flex gap-2">
                                {/* Expand/collapse button */}
                                <button
                                    onClick={() => setExpandedPreview(!expandedPreview)}
                                    className="bg-black/50 text-white p-1 rounded hover:bg-black/70 transition-colors"
                                    title={expandedPreview ? "Collapse preview" : "Expand preview"}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        {expandedPreview ? (
                                            // Collapse icon
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 15l7-7 7 7"
                                            />
                                        ) : (
                                            // Expand icon
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        )}
                                    </svg>
                                </button>

                                {/* Camera preview label */}
                                <div className="text-xs bg-black/50 text-white px-2 py-1 rounded">
                                    Camera Preview
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            <main className="flex items-center justify-center w-9/12">
                <p id="timer" className={`text-8xl font-bold ${timerColor}`}>
                    0.000
                </p>
            </main>
        </section>
    );
}