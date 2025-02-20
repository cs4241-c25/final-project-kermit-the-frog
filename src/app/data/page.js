'use client'
import './../globals.css';
import Link from 'next/link';
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
    <div className="bg-gray-300">
      <nav className="bg-red-700 shadow-2xl sticky top-0 p-4 left-0">
        <div className="container mx-auto flex text-4xl justify-between items-center">
          <Link href="/" className="font-bold">
            Kermit Timer
          </Link>
          <div className="flex space-x-10 ml-auto">
            <Link href="/timer">Back</Link>
          </div> 
        </div>
      </nav>
      <section className="h-screen flex items-center justify-center">
        <div className="md:w-1/2 text-center p-8">
            <button id="accountData" className="bg-gray-400 text-5xl text-black p-12 m-8 rounded-xl justify-center items-center">All Account Data:</button>
            <ul id="datalist" className="text-black text-2xl">
              <li>Loading...</li>
            </ul>
        </div>
      </section>
    </div>
  );
}