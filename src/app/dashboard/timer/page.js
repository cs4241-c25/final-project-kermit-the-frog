'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import VideoRecorder from '../../../components/VideoRecorder';
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
    const [sessionUpdater, setSessionUpdater] = useState(0);
    const [currentSession, setCurrentSession] = useState(null);
    const [selectedSession, setSelectedSession] = useState("3x3");
    const [openAddSession, setOpenAddSession] = useState(false);
    const [newSessionCreated, setNewSessionCreated] = useState(false);
    const [allSessions, setAllSessions] = useState(["3x3", "5x5"]);

    // Video recording state
    const [isRecording, setIsRecording] = useState(false);

    // State for tracking expanded/collapsed state
    const [expandedPreview, setExpandedPreview] = useState(false);

    const valueRef = useRef("3x3");

    useEffect(() => {
        valueRef.current = selectedSession;
    }, [selectedSession]);

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
            //await updateTable()
            await getAllSessions()
        }
        fetchData();
    }, []);

    useEffect(() => {
        if(selectedSession !== null) {
            setCurrentSession(getSession(selectedSession));
        }
    },[selectedSession, sessionUpdater]);

    /* Runs once when the page loads to set the default Session */
    useEffect(() => {
        setCurrentSession(getSession('3x3'));
    },[])

    useEffect(() => {
        updateTable();
        console.log("Selected Session Has Changed TO:", selectedSession);
    }, [selectedSession]);

    useEffect(() => {
        if (currentSession !== null) {
            Promise.resolve(currentSession).then(resolvedSession => {
                if (resolvedSession.session?.timerData?.length > 0) {
                    resolvedSession.session.timerData.sort((a, b) => b.timestamp - a.timestamp);
                    setUpdateData(resolvedSession.session.timerData);
                }
            }).catch(error => console.error("Error resolving session:", error));
        }
    }, [currentSession]);

    /*
    * If a new session was created and updated the selected Session (response.ok), add the new session to the list of
    * options if it doesn't already exist (a saftey check if it gets past db check)
    */
    useEffect(() => {
        if(newSessionCreated && selectedSession) {
            setAllSessions((prev) =>
                prev.includes(selectedSession) ? prev : [...prev, selectedSession])
        }
        setNewSessionCreated(false)
    }, [newSessionCreated, selectedSession]);


    const updateTable = () => {
        if (valueRef) {
            getSession(valueRef.current).then((sessionData) => {
                setCurrentSession(sessionData);
            });
        }
    };

    function updateTimerColor() {
        if (running) {
            setTimerColor("text-text");
        } else if (ready) {
            setTimerColor("text-green-500");

            // Start recording when timer turns green (ready state)
            if (ready && !isRecording) {
                setIsRecording(true);
            }
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
        setIsRecording(true);
    }

    async function stopTimer() {
        clearInterval(timerInterval);
        running = false;
        updateTimerColor();
        await addTimeToDB(elapsedTime, Date.now());
        updateTable();

        // Stop recording
        setIsRecording(false);
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

        // Make sure to stop any recording that might have started
        if (!running && isRecording) {
            setIsRecording(false);
        }
    }

    /* Need to change how data is added to Database with the newly created Session */
    async function addTimeToDB(time, timestamp) {
        try {
            const data = {time: time, timestamp: timestamp, sessionName: valueRef.current};
            const response = await fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            await response.json()
            //await updateTable()
        } catch (err) {
            console.error(' addTimeToDB Error:', error);
            alert("Error: Unauthorized, please restart your browser");
        }
    }

    async function handleDelete(id, sessionName) {
        try {
            const response = await fetch('/api/delete', {
                method: 'DELETE', //change to DELETE
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({id, sessionName}),
            })
            await response.json;
            //use Remove the data from data List, will rerender w/o the given id element
            setUpdateData(prev => prev.filter(solve => solve._id !== id));
        } catch (error) {
            console.error('Delete Error:', error);
        }
    }

    async function handleStatusChange(id, status, sessionName) {
        try {
            const response = await fetch('/api/updateSolve', {
                method: 'POST', //can be changes to GET
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({id, status, sessionName}),
            })
            await response.json;
            //use state to change the status by making sure state is updated before the call
            setUpdateData(prev => prev.filter(solve => solve._id !== id));
            //await updateTable();
        } catch (error) {
            console.error('Status Change Error:', error);
        }
    }

    /* Use GET function in Data, update is redundant 
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
    }*/

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
    /* Gets one User sessions */
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
    /* Gets All Existing User sessions */
    async function getAllSessions() {
        try{
            const response = await fetch(`/api/sessions?getAllSessions=true`, {
                method: 'GET'
            })
            if(response.ok) {
                const result = await response.json();
                const parseSessions = result.session.map(session => session.sessionName)
                setAllSessions(parseSessions)
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
            <li key={solve.solveID}>
                <button
                    className={`w-full text-center px-2 py-1 hover:bg-secondary/20 
                        ${dropDown[solve.solveID] 
                            ? 'bg-secondary/20 rounded-t-2xl hover:bg-accent/10' 
                            : 'rounded-2xl hover:bg-accent/10'
                        } 
                        flex items-center justify-center gap-2 transition-all duration-200`}
                    onClick={() => toggleDropDown(solve.solveID)}
                >
                    <span>{time}</span>
                    <svg
                        className={`w-4 h-4 transition-transform duration-300 ${dropDown[solve.solveID] ? 'rotate-180' : ''}`}
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
                        ${dropDown[solve.solveID] ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <div className="bg-secondary/20 flex flex-col gap-1 rounded-b-2xl transform transition-transform duration-200">
                        <button className="hover:bg-accent/10 px-2 py-1"
                            onClick={() => handleStatusChange(solve.solveID, "OK", valueRef.current).then(() => toggleDropDown(solve.solveID))}
                        >
                            OK
                        </button>
                        <button className="hover:bg-accent/10 px-2 py-1"
                            onClick={() => handleStatusChange(solve.solveID, "+2", valueRef.current)}
                        >
                            +2
                        </button>
                        <button className="hover:bg-accent/10 px-2 py-1"
                            onClick={() => handleStatusChange(solve.solveID, "DNF", valueRef.current)}
                        >
                            DNF
                        </button>
                        <button className="hover:bg-accent/10 px-2 py-1 rounded-b-2xl text-red-400"
                            onClick={() => handleDelete(solve.solveID, valueRef.current)}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </li>
        )
    }

    // Handler for when recording completes
    const handleRecordingComplete = (blob) => {
        console.log("Recording completed, video size:", blob.size);
    };

    return (
        <section className="flex h-full">
            <aside className="w-3/12 p-4 bg-primary/20 flex flex-col">
                <div className="flex flex-col items-center gap-4 lg:flex-row mb-4 h-fit justify-between">
                    <select
                        className="dropdown w-full text-xl h-12"
                        value={valueRef.current}
                        onChange={(e) => {setSelectedSession(e.target.value)}}
                    >
                        {
                            allSessions.map((session, index) => (
                                <option key={index} value={session}>
                                    {session}
                                </option>
                            ))
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
                    {(updateData !== null) ? updateData.map(createTimeData) : <li className="text-center">No times yet</li>}
                </ul>
                
                {/* Video recording component */}
                <VideoRecorder
                    isRecording={isRecording}
                    onRecordingComplete={handleRecordingComplete}
                />
            </aside>

            <main className="flex items-center justify-center w-9/12">
                <p id="timer" className={`text-8xl font-bold ${timerColor}`}>
                    0.000
                </p>
            </main>
        </section>
    );
}