'use client'
import { useEffect } from 'react';

export default function Data() {

  useEffect(() => {
    updateData();
  }, []);

  function updateData() {
    console.log("/api/data");
    fetch('/api/data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => response.json())
    .then(result => {
      console.log("return called");
      console.log("result is below");
      console.log(result);
      const datalist = document.getElementById("datalist");
  
      datalist.innerHTML = `<p>User ID: ${result.user._id} - Email: ${result.user.email}</p>`;
      
      result.solves.forEach(solve => {
        const dataItem = document.createElement("li");
        dataItem.classList.add("data-item");
        dataItem.classList.add("3xl");
        dataItem.dataset.id = solve._id;
        dataItem.innerHTML = `SolveID: ${solve._id} - Time: ${(solve.time/1000).toFixed(3)} - Timestamp: ${solve.timestamp} - Status: ${solve.status}`;
        datalist.appendChild(dataItem);
      });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  return (
    <div className="bg-background/90 flex flex-col h-full">
      <section className="flex flex-1 items-center justify-center">
        <div className="md:w-1/2 text-center p-8">
          <button 
            id="accountData" 
            className="button text-text text-4xl p-8 m-4 rounded-xl"
          >
            All Account Data:
          </button>
          <ul id="datalist" className="text-text text-2xl">
            <li>Loading...</li>
          </ul>
        </div>
      </section>
    </div>
  );
}