'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import VideoRecorder from '../../../components/VideoRecorder';
import Modal from "@/app/dashboard/timer/Modal";
import axios from 'axios'

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

    const [pb, setPB] = useState(null);
    const [pbAo5, setPBAo5] = useState(null);

    // Video recording state
    const [isRecording, setIsRecording] = useState(false);

    // State for tracking expanded/collapsed state
    const [expandedPreview, setExpandedPreview] = useState(false);

    const valueRef = useRef("3x3");

    useEffect(() => {
        valueRef.current = selectedSession;
    }, [selectedSession]);

		// State for the current 3x3 scramble
		const [scramble, setScramble] = useState('No Scramble Generated');
		const [loading, setLoading] = useState(false);
		const scrambleRef = useRef('');

		useEffect(() => {
			updateCurrentScramble();
		}, []);

		useEffect(() => {
        scrambleRef.current = scramble;
    }, [scramble]);

    useEffect(() => {
        if (session.status === "authenticated") {
            router.push('/dashboard/timer');
        }
    }, [session.status, router]);

    useEffect(() => {
        const timerElement = document.getElementById("timer");

        const keyDownHandlerWrapper = (event) => {
            if (!openAddSession) {
                keyDownHandler(event);
            }
        };

        const keyUpHandlerWrapper = (event) => {
            if (!openAddSession) {
                keyUpHandler(event);
            }
        };

        const touchStartHandlerWrapper = (event) => {
            if (!openAddSession) {
                touchStartHandler(event);
            }
        };

        const touchEndHandlerWrapper = (event) => {
            if (!openAddSession) {
                touchEndHandler(event);
            }
        };

        if (timerElement) {
            timerElement.addEventListener("touchstart", touchStartHandlerWrapper);
            timerElement.addEventListener("touchend", touchEndHandlerWrapper);
        }

        document.addEventListener("keydown", keyDownHandlerWrapper);
        document.addEventListener("keyup", keyUpHandlerWrapper);

        return () => {
            if (timerElement) {
                timerElement.removeEventListener("touchstart", touchStartHandlerWrapper);
                timerElement.removeEventListener("touchend", touchEndHandlerWrapper);
            }
            document.removeEventListener("keydown", keyDownHandlerWrapper);
            document.removeEventListener("keyup", keyUpHandlerWrapper);
        };
    }, [openAddSession]);

    useEffect(() => {
        const fetchData = async () => {
            //await updateTable()
            await getAllSessions()
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedSession !== null) {
            setCurrentSession(getSession(selectedSession));
        }
    }, [selectedSession, sessionUpdater]);

    /* Runs once when the page loads to set the default Session */
    useEffect(() => {
        setCurrentSession(getSession('3x3'));
    }, [])

    useEffect(() => {
        updateTable();
        updatePBs();
        console.log("Selected Session Has Changed TO:", selectedSession);
    }, [selectedSession]);

    useEffect(() => {
        console.log("Current Session Has Changed TO:", currentSession);
    }, [currentSession]);

    useEffect(() => {
        if (currentSession !== null) {
            Promise.resolve(currentSession).then(resolvedSession => {
                if (resolvedSession.session?.timerData?.length > 0) {
                    findPB(resolvedSession);
                    findPBAo5(resolvedSession);
                    resolvedSession.session.timerData.sort((a, b) => b.timestamp - a.timestamp);
                    setUpdateData(resolvedSession.session.timerData);
                } else {
                    setUpdateData(null);
                }
            }).catch(error => console.error("Error resolving session:", error));
        }
    }, [currentSession]);

    /*
    * If a new session was created and updated the selected Session (response.ok), add the new session to the list of
    * options if it doesn't already exist (a saftey check if it gets past db check)
    */
    useEffect(() => {
        if (newSessionCreated && selectedSession) {
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

    const updatePBs = () => {
        if (valueRef) {
            getSession(valueRef.current).then((sessionData) => {
                findPB(sessionData);
                findPBAo5(sessionData);
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
        event.preventDefault();
        if (event.code === "ArrowUp") {
        }
        upTriggered = false;
        if (event.code === "Space") {
            pressed = true;
            updateTimerColor();
        }
        if (event.code === "Space" && !downTriggered) {
            downTriggered = true;
            updateTimerColor();
            if (running) {
                stopTimer();
                updateCurrentScramble(); // Generate a new scramble for next timer event
            } else if (event.code === "Space") {
                startTimeoutTimer();
            }
        }
    }

    function keyUpHandler(event) {
        event.preventDefault();
        downTriggered = false;
        if (event.code === "Space") {
            pressed = false;
            updateTimerColor();
        }
        if (event.code === "Space" && !upTriggered) {
            upTriggered = true;
            if (event.code === "Space" && ready) {
                startTimer();
                stopTimeoutTimer();
            } else if (event.code === "Space" && !ready) {
                stopTimeoutTimer();
            }
        }
    }

    function touchStartHandler(event) {
        event.preventDefault();
        updateTimerColor();
        if (!downTriggered) {
            downTriggered = true;
            updateTimerColor();
            if (running) {
                stopTimer();
                updateCurrentScramble();
            } else {
                startTimeoutTimer();
            }
        }
    }

    // Touch end handler (similar to keyUpHandler)
    function touchEndHandler(event) {
        event.preventDefault();
        downTriggered = false;
        updateTimerColor();
        if (!upTriggered) {
            upTriggered = true;
            if (ready) {
                startTimer();
                stopTimeoutTimer();
            } else {
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
    async function addTimeToDB(time, timestamp, scramble) {
        try {
            const data = {time: time, timestamp: timestamp, sessionName: valueRef.current, scramble: scrambleRef.current};
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
            updateTable();
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
            updateTable();
            //setUpdateData(prev => prev.filter(solve => solve._id !== id));
            //await updateTable();
        } catch (error) {
            console.error('Status Change Error:', error);
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
    async function createSession(sessionName, isThreeByThree) {
        try {
            setPB("-");
            setPBAo5("-");
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({sessionName: sessionName, isThreeByThree: isThreeByThree}),
            })
            if (response.ok) {
                setNewSessionCreated(true)
                setSelectedSession(sessionName)
            }
        } catch (error) {
            console.error(' createSession Error:', error);
        }
    }

    /* Gets one User sessions */
    async function getSession(sessionName) {
        try {
            const response = await fetch(`/api/sessions?sessionName=${sessionName}`, {
                method: 'GET'
            })
            if (response.ok) {
                return response.json();
            }
        } catch (error) {
            console.error('Error fetching user sessions: ', error);
        }
    }

    /* Gets All Existing User sessions */
    async function getAllSessions() {
        try {
            const response = await fetch(`/api/sessions?getAllSessions=true`, {
                method: 'GET'
            })
            if (response.ok) {
                const result = await response.json();
                const parseSessions = result.session.map(session => session.sessionName)
                setAllSessions(parseSessions)
            }
        } catch (error) {
            console.error('Error fetching user sessions: ', error);
        }
    }

    function getScramble(solveID) {
        if (currentSession) {
            const scramble = currentSession.session?.timerData.find(
                (item) => item.solveID === solveID
            )?.scramble;

            if (scramble) {
                return scramble;
            } else {
            }
        }
    }

    function findPB(sessionInput) {
            let newArray = [];

            for (let i = 0; i < sessionInput?.session?.timerData.length; i++) {
                const currentSolve = sessionInput?.session?.timerData[i];
                if (currentSolve) {
                    if (currentSolve.status === "+2") {
                        newArray.push((currentSolve.time / 1000) + 2);
                    } else if (currentSolve.status === "OK") {
                        newArray.push(currentSolve.time / 1000);
                    }
                }
            }

            newArray.sort((a, b) => a - b);
            let pb = newArray[0];
            if (!pb) {
                pb = "-";
                setPB(pb);
                return;
            }
            setPB(pb.toFixed(3));

    }

    function calculateAo5(one, two, three, four, five) {
        let sum = one + two + three + four + five;
        let min = Math.min(one, two, three, four, five);
        let max = Math.max(one, two, three, four, five);
        return ((sum - min - max) / 3).toFixed(3);
    }

    function findPBAo5(sessionInput) {
        let newArray = [];
        // sessionInput?.session?.timerData?.sort((a, b) => a.time - b.time);

        if (sessionInput?.session?.timerData.length < 5) {
            setPBAo5("-");
        }

        for (let i = 0; i < sessionInput?.session?.timerData.length; i++) {
            const currentSolve = sessionInput?.session?.timerData[i];
            if (currentSolve) {
                if (currentSolve.status === "+2") {
                    newArray.push((currentSolve.time / 1000) + 2);
                } else if (currentSolve.status === "OK") {
                    newArray.push(currentSolve.time / 1000);
                } else if (currentSolve.status === "DNF") {
                    newArray.push(999999999);
                }
            }
        }

        let averagesArray = [];
        for (let i = 0; i < newArray.length - 4; i++) {
            let ao5 = calculateAo5(newArray[i], newArray[i + 1], newArray[i + 2], newArray[i + 3], newArray[i + 4]);
            averagesArray.push(ao5);
        }

        averagesArray.sort((a, b) => a - b);
        let pbAo5 = Number(averagesArray[0]).toFixed(3);
        if (pbAo5 > 100000) {
            pbAo5 = "DNF";
        }
        if (sessionInput?.session?.timerData.length >= 5) {
            setPBAo5(pbAo5);
        }
    }

    function createAo5Data(solve) {
			/*Creates a List for each time again,*/
			let solveIndex = currentSession?.session?.timerData.findIndex(s => s.solveID === solve.solveID);
			//let solveIndex = currentSession?.session?.timerData.length - inverseIndex - 1;
			let time;
			if (solveIndex > currentSession?.session?.timerData.length - 5) {
				time = "-";
			}
			else{
				let timeArray = [];

				for (let i = 0; i < 5; i++) {
					const currentSolve = currentSession?.session?.timerData[solveIndex + i];
					if (currentSolve) {
						if (currentSolve.status === "+2") {
							timeArray.push((currentSolve.time / 1000) + 2);
						} else if (currentSolve.status === "OK") {
							timeArray.push(currentSolve.time / 1000);
						} else{
							timeArray.push(999999999);
						}
					}
				}

				timeArray.sort((a, b) => a - b);

				timeArray.shift();
				timeArray.pop();

				let sum = timeArray.reduce((acc, current) => acc + current, 0);
				time = (sum / 3).toFixed(3);
				if (time > 100000) {
					time = "DNF";
				}
			}

			return (
				<li key={solveIndex}>
					<button
						className={`w-full text-center px-4 py-2 hover:bg-secondary/20 
							${dropDown[solveIndex] 
								? 'bg-secondary/20 rounded-t-2xl hover:bg-accent/10' 
								: 'rounded-2xl hover:bg-accent/10'
							} 
							flex items-center justify-center gap-2 transition-all duration-200`
						}
					>
						<span className='whitespace-pre-line'>{time}</span>
					</button>
				</li>
			)
    }


    function createTimeData(solve) {
        let time = (solve.time / 1000).toFixed(3);
        if (solve.status === "DNF") time = "DNF"
        else if (solve.status === '+2') time = `${(Number(time) + 2).toFixed(3)}+`

        return (
            <li key={solve.solveID}>
                <button
                    className={`relative w-full text-center px-4 py-2 hover:bg-secondary/20 
                        ${dropDown[solve.solveID]
                        ? 'bg-secondary/20 rounded-t-2xl hover:bg-accent/10'
                        : 'rounded-2xl hover:bg-accent/10'
                    		}
												${openAddSession ? '-z-10' : ''}
                        flex items-center justify-center gap-2 transition-all duration-200`}
                    onClick={() => toggleDropDown(solve.solveID)}
                >
                    <span>{time}</span>
                    <svg
                        className={`absolute right-5 w-4 h-4 transition-transform duration-300 ${dropDown[solve.solveID] ? 'rotate-180' : ''}`}
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
                        ${dropDown[solve.solveID] ? 'max-h-600 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <div className="bg-secondary/20 flex flex-col gap-1 rounded-b-2xl transform transition-transform duration-200">
                        {currentSession?.session?.isThreeByThree
													? <label className="hover:bg-accent/10 px-2 py-1 text-center font-bold text-xs">
                            	{getScramble(solve.solveID)}
                        		</label>
													: <div></div>
												}
                        <button className="hover:bg-accent/10 px-2 py-1"
                                onClick={() => handleStatusChange(solve.solveID, "OK", valueRef.current).then(() => toggleDropDown(solve.solveID))}
                        >
                            OK
                        </button>
                        <button className="hover:bg-accent/10 px-2 py-1"
                                onClick={() => handleStatusChange(solve.solveID, "+2", valueRef.current).then(() => toggleDropDown(solve.solveID))}
                        >
                            +2
                        </button>
                        <button className="hover:bg-accent/10 px-2 py-1"
                                onClick={() => handleStatusChange(solve.solveID, "DNF", valueRef.current).then(() => toggleDropDown(solve.solveID))}
                        >
                            DNF
                        </button>
                        <button className="hover:bg-accent/10 px-2 py-1 rounded-b-2xl text-red-400"
                                onClick={() => handleDelete(solve.solveID, valueRef.current).then(() => toggleDropDown(solve.solveID))}
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

		// Make a GET request to the Scramble API server
		const updateCurrentScramble = async () => {
			if (!currentSession?.session?.isThreeByThree){
				setScramble('');
			}
			else {
				setLoading(false);
				try {
					const data = await axios.get('https://scrambler-api-s5qg.onrender.com/getScramble')
					.then(response => setScramble(response.data));
					setLoading(true);
				} catch {}
			}
		}

    return (
        <section className=" flex h-[100%] flex-col lg:flex-row">
            <aside className="w-full lg:w-1/4 p-4 bg-primary/20 flex flex-col h-fit md:h-full">
                <div className="flex lg:flex-col items-center gap-4 mb-4 justify-between">
                    <select
                        className="dropdown w-1/2 lg:w-full h-10 lg:h-12 text lg:text-xl"
                        value={valueRef.current}
                        onChange={(e) => {
                            setSelectedSession(e.target.value)
                        }}
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
                        className="button text-xl p-0 m-0  w-1/2 lg:w-full h-10 lg:h-12 lg:aspect-square lg:size-12"
                        title="Add Custom Session"
                        onClick={() => setOpenAddSession(true)}
                    >
                        +
                    </button>
                </div>

                <table className="text-text font-semibold text-lg border-separate border-spacing-1 mb-4 hidden md:table ">
                    <tbody>
                    <tr>
                        <td className="bg-primary p-2 rounded text-center w-[50%]">Session Best:</td>
                        <td className="bg-primary p-2 rounded text-center w-[50%]">Session Best Ao5:</td>
                    </tr>
                    <tr>
                        <td className="bg-primary/55 p-2 rounded text-center w-[50%]">{pb}</td>
                        <td className="bg-primary/55 p-2 rounded text-center w-[50%]">{pbAo5}</td>
                    </tr>
                    </tbody>
                </table>
                <div id="headerContainer" className="grid-cols-2 gap-4 mb-4 hidden lg:grid">
                    <h2 className="text-3xl font-bold text-center">Time</h2>
                    <h2 className="text-3xl font-bold text-center">Ao5</h2>
                </div>
                <div className="overflow-y-auto hidden lg:block">
                    {
                        (updateData === null || createAo5Data === null) &&
                        <h2 className="text-2xl font-semibold mb-4 text-center"> No data available</h2>
                    }
                    <ul className={`text-2xl flex-grow overflow-y-auto ${(updateData !== null) ? "visible" : "invisible"}`}>
                        {
                            (updateData !== null) && updateData.map((item, index) => (
                                <li key={index} className="flex justify-between">
                                    <ul className="flex-grow w-1/2">
                                        {createTimeData(item)}
                                    </ul>
                                    <ul className="flex-grow w-1/2">
                                        {createAo5Data(item)}
                                    </ul>
                                </li>
                            ))
                        }
                    </ul>
                </div>
            </aside>

            <main className="flex flex-col items-center justify-center w-full lg:w-3/4 h-[100%] relative" >
								<div className={`${currentSession?.session?.isThreeByThree ? 'hidden lg:flex' : 'hidden'} absolute top-0 items-center justify-center w-full h-[15%] bg-primary/20 flex-wrap ${openAddSession ? '-z-10' : ''} `}>
										{loading
										? <p id="scramble" className="whitespace-pre-line text-2xl text-center text-text/90 md:flex">{scramble.replace(/ /g,'.').replaceAll('..','.').replaceAll('.','  ')}</p>
										: <div role="status">
													<svg aria-hidden="true" className="inline w-8 h-8 text-background animate-spin fill-primary/60" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
															<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
															<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
													</svg>
													<span className="sr-only">Loading...</span>
											</div>
										}
										<button type="button" className={`xl:absolute right-14 button px-2.5 py-2 text-lg w-auto ml-10 md:flex ${currentSession?.session?.isThreeByThree ? 'md:inline hidden' : 'hidden'}`} onClick={function(e){document.activeElement.blur(); updateCurrentScramble()}}>New Scramble</button>
								</div>
                <p id="timer" className={`text-8xl font-bold ${timerColor} ${currentSession?.session?.isThreeByThree ? 'pt-[4.16%]' : ''} ${expandedPreview? 'ml-[25%] w-[70%]' : ''} pb-4 lg:pb-0 select-none`}>
                    0.000
                </p>
                {/* Video recording component */}
								<div className={`${openAddSession ? '-z-10' : ''}`}>
                <VideoRecorder
                    isRecording={isRecording}
                    isExpanded={() => {setExpandedPreview(true)}}
                    isClosed={() => {setExpandedPreview(false)}}
                    onRecordingComplete={handleRecordingComplete}
                />
								</div>
            </main>
            {
                openAddSession && (
                    <Modal showModal={openAddSession}
                           close={() => setOpenAddSession(false)}
                           createSession={createSession}
                    />
                )
            }
        </section>
    );

}