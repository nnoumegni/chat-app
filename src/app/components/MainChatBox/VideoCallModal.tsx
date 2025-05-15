import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../store/use-app.store";
import { DailyCallManager } from "../../helpers/DailyCallManager";
import '/public/assets/dailyCallStyle.css';

interface RoomUser {
    userId: number;
    fullname: string;
    thumb?: string;
    isConnected?: boolean;
    status?: number;
}

interface AppStore {
    socket: any;
    selectedRoom: {
        type: string;
        users: Record<string, RoomUser>;
        uri: string;
        roomUri: string;
    };
    user: RoomUser;
    toggleVideoCall: boolean;
    setToggleVideoCall: (params: { toggleVideoCall: boolean }) => void;
}

interface CallData {
    from: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}

const ringtone = new Audio("/assets/ringtone.mp3");

export const VideoCallModal = () => {
    const { socket, selectedRoom, user, toggleVideoCall, setToggleVideoCall } = useAppStore() as unknown as AppStore;
    
    const [videoModal, setVideoModal] = useState<any>(null);
    const managerRef = useRef<DailyCallManager | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Only create the manager if it doesn't exist and we need it
        if (!managerRef.current && toggleVideoCall) {
            managerRef.current = new DailyCallManager();
        }

        if (socket && selectedRoom && managerRef.current) {
            socket.on('call:join', (data: CallData) => {
                if (managerRef.current) {
                    // Handle join call
                    console.log('Join call:', data);
                }
            });

            socket.on("incoming-call", async ({ from, offer }: CallData) => {
                if (offer) {
                    await ringtone.play();
                    // Handle incoming call
                }
            });

            socket.on("call-answered", async ({ answer }: CallData) => {
                if (answer) {
                    // Handle call answered
                }
            });

            socket.on("new-ice-candidate", async ({ candidate }: CallData) => {
                if (candidate) {
                    // Handle new ICE candidate
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('call:join');
                socket.off('incoming-call');
                socket.off('call-answered');
                socket.off('new-ice-candidate');
            }
            if (managerRef.current) {
                managerRef.current.destroy();
                managerRef.current = null;
            }
        };
    }, [socket, selectedRoom, user, toggleVideoCall]);

    // Clean up when component unmounts
    useEffect(() => {
        return () => {
            if (managerRef.current) {
                managerRef.current.destroy();
                managerRef.current = null;
            }
        };
    }, []);

    return (
        <div className="modal fade" id="videoCallingScreen" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-body">
                        <div className="video-calling">
                            <div className="video-calling-header">
                                <h4>Video Call</h4>
                                <button type="button" className="btn-close" onClick={() => setToggleVideoCall({ toggleVideoCall: false })}></button>
                            </div>
                            <div className="video-calling-body">
                                <div className="video-streams">
                                    <video ref={localVideoRef} id="localVideo" autoPlay playsInline muted></video>
                                    <video ref={remoteVideoRef} id="remoteVideo" autoPlay playsInline></video>
                                </div>
                                <div className="controls">
                                    <button id="toggle-camera" disabled={true}>Toggle Camera</button>
                                    <button id="toggle-mic" disabled={true}>Toggle Microphone</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
