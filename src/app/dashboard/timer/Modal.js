'use client';
import {useState} from "react";


export default function Modal(props) {
    const [input, setInput] = useState("");
    const closeOnWindowClick = (e) => {
        if (e.target === e.currentTarget) {
            props.close()
        }
    }

    const submitSession = () => {
        if (input.trim() !== "") {
            props.createSession(input);
            props.close()
        }
    }


    return (
        <div className={`${props.showModal ? 'visible' : 'hidden'}  fixed inset-0 bg-background/80 pt-16`}
             onClick={closeOnWindowClick}>
            <div className={` bg-primary/65 shadow-xl m-5 p-5 border border-transparent w-1/5 mx-auto rounded-lg`}
                 onClick={(e) => e.stopPropagation()}>
                <span className="close cursor-pointer m-2" id="closeModal" onClick={props.close}>
                    <button className="button text-xl p-0 m-0  lg:aspect-square lg:size-12 ">
                        X
                    </button>
                </span>
                <div className="items-center justify-center text-center p-4 m-4">
                    <div className=" m-4">
                        <label className='text-xl'> New Session Name:
                            <input type="text" className="rounded-xl p-2 bg-background/40 border border-background/40"
                                   onChange={(e) => setInput(e.target.value)}
                                   required/>
                        </label>
                    </div>
                    <div className="flex items-center justify-center ">
                        <button className="button p-2 text-xl" onClick={submitSession}>
                            Create Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
