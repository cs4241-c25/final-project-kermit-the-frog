'use client';
import { useState, useRef, useEffect } from 'react';
import { 
    isVideoRecordingSupported, 
    downloadRecordedVideo, 
    stopMediaTracks,
    getBestVideoMimeType,
    getFileExtension
} from '../utils/videoRecording';
import ConfirmationModal from './ConfirmationModal';

export default function VideoRecorder({ isRecording, onRecordingComplete, isExpanded, isClosed }) {
    const [videoMode, setVideoMode] = useState(false);
    const [cameraPermission, setCameraPermission] = useState(null);
    const [expandedPreview, setExpandedPreview] = useState(false);
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [mimeType, setMimeType] = useState('video/webm');
    const [isRecordingReady, setIsRecordingReady] = useState(false);

    // Effect to initialize the MediaRecorder as soon as camera is ready
    useEffect(() => {
        if (videoMode && videoRef.current?.srcObject && cameraPermission === 'granted') {
            prepareRecording();
        }
    }, [videoMode, cameraPermission]);

    // Effect to handle recording state changes from parent component
    useEffect(() => {
        if (isRecording && videoMode && isRecordingReady) {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                startRecording();
            }
        } else if (!isRecording && mediaRecorderRef.current?.state === 'recording') {
            stopRecording();
        }
    }, [isRecording, videoMode, isRecordingReady]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            cleanupVideoResources();
        };
    }, []);

    useEffect(() => {
        if(expandedPreview){
            isExpanded();
        } else {
            isClosed()
        }
    }, [expandedPreview]);

    // Complete cleanup of all video resources
    const cleanupVideoResources = () => {
        // Stop any active recordings
        if (mediaRecorderRef.current?.state === 'recording') {
            try {
                mediaRecorderRef.current.stop();
            } catch (err) {
                console.error('Error stopping recorder during cleanup:', err);
            }
        }
        
        // Release the media stream
        if (videoRef.current?.srcObject) {
            stopMediaTracks(videoRef.current.srcObject);
            videoRef.current.srcObject = null;
        }
        
        // Reset recorder
        mediaRecorderRef.current = null;
    };

    // Initialize MediaRecorder as soon as possible to reduce start delay
    const prepareRecording = () => {
        if (!videoMode || !videoRef.current || !videoRef.current.srcObject) {
            console.log('Cannot prepare recording, prerequisites not met');
            return;
        }
        
        try {
            console.log('Preparing recording with new MediaRecorder instance');
            recordedChunksRef.current = []; // Clear any previous recording chunks
            
            const stream = videoRef.current.srcObject;
            // Just create the MediaRecorder but don't start it yet
            const newMediaRecorder = new MediaRecorder(stream, { mimeType });
            
            newMediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                    console.log(`Received data chunk: ${event.data.size} bytes`);
                }
            };
            
            newMediaRecorder.onstop = () => {
                console.log('MediaRecorder stopped, processing recording...');
                if (recordedChunksRef.current.length === 0) {
                    console.warn('No recorded chunks available');
                    return;
                }
                
                const blob = new Blob(recordedChunksRef.current, { type: mimeType });
                console.log(`Created recording blob: ${blob.size} bytes`);
                setRecordedBlob(blob);
                setShowDownloadModal(true);
                
                if (onRecordingComplete) {
                    onRecordingComplete(blob);
                }
            };
            
            // Store the new MediaRecorder instance
            mediaRecorderRef.current = newMediaRecorder;
            setIsRecordingReady(true);
            console.log('Recording prepared and ready to start instantly');
        } catch (err) {
            console.error('Error preparing recorder:', err);
            setIsRecordingReady(false);
        }
    };

    const toggleVideoMode = async () => {
        try {
            console.log("Toggle video mode clicked, current state:", videoMode);
            
            if (!videoMode) {
                console.log("Attempting to access camera...");
                
                // Check if browser supports getUserMedia
                if (!isVideoRecordingSupported()) {
                    throw new Error("Your browser doesn't support camera access");
                }
                
                // First set videoMode to true so the video element renders
                setVideoMode(true);
                setIsRecordingReady(false);
                
                // Get the best supported video format
                const bestMimeType = getBestVideoMimeType();
                setMimeType(bestMimeType);
                
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
                        
                        // The useEffect will call prepareRecording once camera is ready
                    } catch (innerErr) {
                        console.error("Error accessing camera after delay:", innerErr);
                        setCameraPermission('denied');
                        setVideoMode(false);
                        alert(`Camera error: ${innerErr.message}`);
                    }
                }, 100); // Short delay to ensure DOM is updated
                
            } else {
                console.log("Turning off video mode, performing full cleanup");
                
                // Full cleanup of all resources
                cleanupVideoResources();
                
                // Reset all recording-related state
                setIsRecordingReady(false);
                setCameraPermission(null);
                setVideoMode(false);
                recordedChunksRef.current = [];
            }
        } catch (err) {
            console.error("Error in toggleVideoMode:", err);
            setCameraPermission('denied');
            setIsRecordingReady(false);
            alert(`Camera error: ${err.message || "Could not access camera. Please check your browser permissions."}`);
            setVideoMode(false);
        }
    };

    const startRecording = () => {
        if (!videoMode || !isRecordingReady || !mediaRecorderRef.current) {
            console.error('Cannot start recording, prerequisites not met');
            return;
        }
        
        if (mediaRecorderRef.current.state === 'recording') {
            console.warn('Already recording, ignoring start request');
            return;
        }
        
        try {
            // Clear any previous recorded chunks when starting a new recording
            recordedChunksRef.current = [];
            
            // Start recording
            mediaRecorderRef.current.start();
            console.log('Recording started');
        } catch (err) {
            console.error('Error starting recording:', err);
            // Re-prepare recording on error
            prepareRecording();
        }
    };

    const stopRecording = () => {
        if (!videoMode || !mediaRecorderRef.current) {
            console.warn('Cannot stop recording, no active recorder');
            return;
        }
        
        if (mediaRecorderRef.current.state !== 'recording') {
            console.warn('Not currently recording, ignoring stop request');
            return;
        }
        
        try {
            console.log('Stopping recording...');
            mediaRecorderRef.current.stop();
        } catch (err) {
            console.error('Error stopping recording:', err);
            
            // Even if stopping fails, we should still try to process whatever we have
            if (recordedChunksRef.current.length > 0) {
                const blob = new Blob(recordedChunksRef.current, { type: mimeType });
                setRecordedBlob(blob);
                setShowDownloadModal(true);
                
                if (onRecordingComplete) {
                    onRecordingComplete(blob);
                }
            }
        }
    };
    
    const handleDownloadConfirm = () => {
        if (recordedBlob) {
            const extension = getFileExtension(mimeType);
            const fileName = `solve-${new Date().toISOString()}${extension}`;
            downloadRecordedVideo(recordedBlob, fileName);
        }
    };

    return (
        <>
            <div className="mt-auto p-4 pt-4 rounded-tl-xl absolute bottom-0 right-0 bg-primary/40 w-[50%] lg:w-[20%] flex-1">
                <div className="flex items-center justify-between">
                    <label className="text-lg m-2 font-medium cursor-pointer" onClick={toggleVideoMode}>
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
                    {videoMode && cameraPermission === 'granted' && (
                        <p className="text-secondary-500">
                            Camera active {mimeType.includes('mp4') ? '(MP4)' : '(WebM)'}
                            {isRecording && ' - Recording'}
                        </p>
                    )}
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
                            
                            {/* Recording indicator */}
                            {isRecording && (
                                <div className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-1 rounded">
                                    <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                    Recording
                                </div>
                            )}
                            
                            {/* Camera preview label */}
                            <div className="text-xs bg-black/50 text-white px-2 py-1 rounded">
                                Camera Preview
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Download confirmation modal */}
            <ConfirmationModal
                isOpen={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                onConfirm={handleDownloadConfirm}
                title="Download Solve Recording"
                message="Would you like to download the video of your solve?"
                confirmText="Download"
                cancelText="Skip"
            />
        </>
    );
} 