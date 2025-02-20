'use client';
import '../globals.css';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;

var uptriggered = false;
var downtriggered = false;
var timerClass = "text-9xl font-bold text-black";

var running = false;
var ready = false;
var pressed = false;

let startTimeoutTime = 0;
let elapsedTimeoutTime = 0;
let timerTimeoutInterval = null;
let runningTimeout = false;

const TIMEOUT = 200;

let timerElement;


export default function Timer() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    timerElement = document.getElementById("timer");
    updateTable();
    if (!timerElement) {
      console.error("Timer element not found!");
      return;
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);
  
    return () => {
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
    };
  }, []);

  function keyDownHandler() {
    updateTimerColor();
    uptriggered = false;
    if(event.code === "Space"){
      pressed = true;
      updateTimerColor()
    }
    if(!downtriggered){
      downtriggered = true;
      updateTimerColor()
      if (running) {
        stopTimer();
      }
      else if (event.code === "Space") {
        startTimeoutTimer();
      }
    }
  };

  function keyUpHandler() {
    updateTimerColor();
    downtriggered = false;
    if(event.code === "Space"){
      pressed = false;
      updateTimerColor()
    }
    if(!uptriggered){
      uptriggered = true;
      if (event.code === "Space" && ready) {
        console.log("Space released, and ready, starting timer");
        startTimer();
        stopTimeoutTimer();
      }
      else if (event.code === "Space" && !ready){
        stopTimeoutTimer();
      }
    }
  };

  function startTimer() {
    clearInterval(timerInterval);
    startTime = 0;
    elapsedTime = 0;
    timerInterval = null;

    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
      elapsedTime = Date.now() - startTime;
      document.getElementById("timer").innerText = (elapsedTime / 1000).toFixed(3);
    }, 10);
    running = true;
    ready = false;
    updateTimerColor()
    stopTimeoutTimer();
    clearInterval(timerTimeoutInterval);
  }

  function stopTimer() {
    addTimeToDB(elapsedTime, Date.now());
    clearInterval(timerInterval);
    running = false;
    updateTimerColor()
  }

  function startTimeoutTimer() {
    startTimeoutTime = 0;
    elapsedTimeoutTime = 0;
    timerTimeoutInterval = null;

    runningTimeout = true;
    startTimeoutTime = Date.now() - elapsedTimeoutTime;
    timerTimeoutInterval = setInterval(() => {
      elapsedTimeoutTime = Date.now() - startTimeoutTime;
      if (elapsedTimeoutTime > TIMEOUT) {
        ready = true;
        runningTimeout = false;
        updateTimerColor()
        stopTimeoutTimer();
      }
    }, 10);
  }

  function stopTimeoutTimer() {
    clearInterval(timerTimeoutInterval);
    runningTimeout = false;
  }

  function addTimeToDB(time, timestamp) {
    const data = { time: time, timestamp: timestamp };

    fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(result => {
        console.log('Time added successfully:', result);
        updateTable();
      })
      .catch((error) => {
        console.error('Error:', error);
        alert("Error: Unauthorized, please restart your browser");
      });
  }

  function updateTimerColor() {
    timerElement.classList.remove("text-red-500", "text-green-500", "text-black");
    
    if (running) {
      timerElement.classList.add("text-black");
    }
    else if (ready) {
      timerElement.classList.add("text-green-500");
    } 
    else if (pressed) {
      timerElement.classList.add("text-red-500");
    } 
    else {
      timerElement.classList.add("text-black");
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Signing out...");
      await signOut({ redirect: false });
      router.push("/");
    } catch (error) {
      setError("Something went wrong");
    }
  };

  function handleDelete(id) {
    fetch('/api/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    })
    .then(response => response.json())
    .then(result => {
      updateTable();
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  function handleStatusChange(id, status) {
    fetch('/api/updateSolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, status }),
    })
    .then(response => response.json())
    .then(result => {
      updateTable();
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  function updateTable() {
    fetch('/api/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then(result => {
      const timelist = document.getElementById("timelist");
      timelist.innerHTML = '';
      
      result.solves.sort((a, b) => b.timestamp - a.timestamp);
  
      result.solves.forEach(solve => {
        const listItem = document.createElement("li");
        listItem.classList.add("time-item");
        listItem.dataset.id = solve._id;
        let time = (solve.time / 1000).toFixed(3);
  
        if (solve.status === 'DNF') {
          time = 'DNF';
        } else if (solve.status === '+2') {
          time = `${(Number(time) + 2).toFixed(3)}+`;
        }
  
        listItem.innerHTML = `
          <button class="time-text">${time}</button>
          <div class="dropdown-menu hidden bg-black-300">
            <button class="menu-btn font-bold status-btn" data-id="${solve._id}" data-status="OK">OK</button>
            <button class="menu-btn font-bold status-btn" data-id="${solve._id}" data-status="+2">+2</button>
            <button class="menu-btn font-bold status-btn" data-id="${solve._id}" data-status="DNF">DNF</button>
            <button class="menu-btn font-bold delete-btn" data-id="${solve._id}">DELETE</button>
          </div>
        `;
  
        timelist.appendChild(listItem);
  
        listItem.querySelector('.delete-btn').addEventListener('click', (event) => {
          const id = event.target.dataset.id;
          handleDelete(id);
        });
  
        listItem.querySelectorAll('.status-btn').forEach(button => {
          button.addEventListener('click', (event) => {
            const id = event.target.dataset.id;
            const status = event.target.dataset.status;
            handleStatusChange(id, status);
          });
        });
  
        listItem.addEventListener('click', () => {
          const menu = listItem.querySelector('.dropdown-menu');
          menu.classList.toggle('hidden');
        });
      });
    })
    .catch((error) => {
      console.error('Error:', error);
      alert("Error: Unauthorized, please restart your browser");
    });
  }

  return (
    <div className="bg-gray-300 flex flex-col h-screen overflow-hidden">
      <nav className="bg-red-700 shadow-2xl sticky top-0 p-4 w-full">
        <div className="container mx-auto flex text-4xl justify-between items-center">
          <Link href="/timer" className="font-bold">Kermit Timer</Link>
          <div className="flex space-x-10 ml-auto">
            <Link href="/data" className="">Show my Data</Link>
            <button type="submit" onClick={handleSubmit}>Log out</button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <div className="bg-gray-800 text-white w-64 p-4 overflow-y-auto flex flex-col">
          <h2 className="text-4xl font-bold mb-4">Times</h2>
          <ul id="timelist" className="space-y-2 text-2xl text-center"></ul>
        </div>
        

        <div className="flex-1 flex justify-center items-center">
          <p id="timer" className={timerClass}>0.000</p>
        </div>
      </div>
    </div>
  );
}