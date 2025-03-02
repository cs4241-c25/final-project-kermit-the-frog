'use client';
import {useState} from "react";


export default function Modal(props) {
    const [input, setInput] = useState("");
    const [isThreeByThree, setIsThreeByThree] = useState(false);
    const closeOnWindowClick = (e) => {
        if (e.target === e.currentTarget) {
            props.close()
        }
    }

    const submitSession = () => {
        if (input.trim() !== "") {
            props.createSession(input, isThreeByThree);
            props.close()
        }
    }


    return (
        <div
            className={`${props.showModal ? 'visible' : 'hidden'} fixed inset-0 bg-background/80 flex items-center justify-center p-4`}
            onClick={closeOnWindowClick}
        >
            <div
                className="bg-primary/65 shadow-xl p-5 border border-transparent rounded-lg max-w-lg w-full sm:w-3/4 md:w-1/2 lg:w-1/3"
                onClick={(e) => e.stopPropagation()}
            >
                <span className="close cursor-pointer " onClick={props.close}>
                    <button className="button text-xl p-2 lg:aspect-square lg:size-12">
                        X
                    </button>
                </span>

                <div className="items-center justify-center text-center p-4">
                    <div className="mb-4">
                        <label className="block text-lg mb-2">
                            New Session Name:
                            <input
                                type="text"
                                className="rounded-xl p-2 w-full bg-background/40 border border-background/40 mt-2"
                                onChange={(e) => setInput(e.target.value)}
                                required
                            />
                        </label>
                    </div>
                    <div>
                        <label className="block text-lg mb-2">
                            <input type="checkbox" onChange={(e) => setIsThreeByThree(e.target.checked)}/> 3x3 Cube Session?
                        </label>
                    </div>
                    <div className="flex justify-center">
                        <button className="button p-2 text-lg w-full sm:w-auto" onClick={submitSession}>
                            Create Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}