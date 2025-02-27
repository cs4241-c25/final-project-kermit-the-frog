'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    const [timerColor, setTimerColor] = useState("text-black"); //state to track color during presses

    /* Current Session Object to allow direct access to the array*/
    const [currentSession, setCurrentSession] = useState(null);
    const [selectedSession, setSelectedSession] = useState("3x3");

    /* State Handling Key Presses & Timer */
    /*
    const [currentTime, setCurrentTime] = useState(0); //Update for timer start
    const [pressedSpace, setPressedSpace] = useState(false); //While space bar is pressed, set state
    const [readyTimer, setReadyTimer] = useState(false); // while primed, set to ready
    const [runningTimer, setRunningTimer] = useState(false); // set state while running timer
    const [displayedTime, setDisplayedTime] = useState("0.000");
    const [timerStartTime, setTimerStartTime] = useState(0);
    */

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
            setTimerColor("text-black");
        } else if (ready) {
            setTimerColor("text-green-500");
        } else if (pressed) {
            setTimerColor("text-red-500");
        } else {
            setTimerColor("text-black");
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
    }

    function stopTimer() {
        clearInterval(timerInterval);
        running = false;
        updateTimerColor();
        addTimeToDB(elapsedTime, Date.now());
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
        setDropDown({...dropDown, [id]: !dropDown[id]});
    }

    /**
     * Creates a sessions with the provided name for the user, and adds a row in the Sessions table with Schema
     * {MongoID, UserID, SessionName, timeData[]}
     * @returns {Promise<void>}
     */
    async function createSession(sessionName){
        try{
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({sessionName: sessionName}),
            })
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
            <li className="time-item" id={solve._id} key={solve._id}>
                <button className="time-text" onClick={() => toggleDropDown(solve._id)}>{time}</button>
                {dropDown[solve._id] && (<div className="dropdown-menu bg-black-300 font-semibold text-xl">
                    <button className="menu-btn p-1" data-id={solve._id}
                            onClick={(e) => {
                                handleStatusChange(solve._id, "OK").then(r =>  toggleDropDown(solve._id))
                            }}>OK
                    </button>
                    <button className="menu-btn p-1" data-id={solve._id}
                            onClick={(e) => handleStatusChange(solve._id, "+2")}>+2
                    </button>
                    <button className="menu-btn p-1" data-id={solve._id}
                            onClick={(e) => handleStatusChange(solve._id, "DNF")}>DNF
                    </button>
                    <button className="menu-btn p-1" data-id={solve._id}
                            onClick={() => handleDelete(solve._id)}>DELETE
                    </button>
                </div>)}
            </li>
        )
    }


    return (
        <div className="bg-gray-300 flex flex-col h-screen overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
                <div className="bg-gray-800 text-white w-64 p-4 overflow-y-auto flex flex-col">
                    <div className="flex text-black">
                        <select
                            value = {selectedSession}
                            onChange={(e) => setSelectedSession(e.target.value)}>
                            <option value="3x3" > 3x3 </option>
                            <option value="5x5" > 5x5 </option>
                            {
                                /* State to track the sessions state, which reloads the visible table and other data */
                                /* Add Option when + is clicked */
                                /* Only the First 2/3 will have the solver api attached */
                                /* When the Plus button is clicked open a pop-up to input name information and a submit to call createSession */
                                /* after its created getSession has to be called aswell */
                            }
                        </select>
                        <button title={"Add Custom Session"} > + </button>
                    </div>
                    <h2 className="text-4xl font-bold mb-4">Times</h2>
                    <ul id="timelist" className="space-y-2 text-2xl text-center">
                        {
                            updateData.map(createTimeData)
                        }
                    </ul>
                </div>

                <div className="flex-1 flex justify-center items-center">
                    <p id='timer' className={`text-9xl font-bold ${timerColor}`}>
                        0.000
                    </p>
                </div>
            </div>
        </div>
    );
}