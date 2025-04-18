import {useEffect, useRef, useState} from "react";
import {useAppStore} from "../../store/use-app.store";
import {DailyCallManager} from "../../helpers/DailyCallManager";
import '/public/assets/dailyCallStyle.css';

const ringtone = new Audio("/assets/ringtone.mp3");

export const VideoCallModal = () => {
    const {socket, selectedRoom, user, toggleVideoCall, setToggleVideoCall} = useAppStore();
    const [videoModal, setVideoModal] = useState(null);
    const [dailyCallManager, setDailyCallManager] = useState(null);
    const [roomUrl, setRoomUrl] = useState(null);
    const [hasJoined, setHasJoined] = useState(false);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef = useRef(null);

    let callManager;
    useEffect(() => {
        if(socket && selectedRoom && dailyCallManager) {
            socket.on("incoming-call", async ({from, offer}) => {
                await ringtone.play();

                const pc = createPeerConnection(from);
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit("answer-call", {to: from, answer});
            });

            socket.on("call-answered", async ({answer}) => {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            });

            socket.on("ice-candidate", async ({candidate}) => {
                if (candidate) {
                    try {
                        await pcRef.current.addIceCandidate(candidate);
                    } catch (e) {
                        console.error("Error adding received ice candidate", e);
                    }
                }
            });

            socket.on("call-ended", () => {
                endCall();
            });

            socket.on("meeting-started", (data) => {
                console.log(data);
                setRoomUrl(data.roomUrl);
                // We first need to make sure the meeting room was created
                dailyCallManager.joinRoom(data.roomUrl, 'joinToken');
            });

            const modal = new (window as any).bootstrap.Modal('#videoCallingScreen', {});
            setVideoModal(modal);
        }

        if(!dailyCallManager && !callManager) {
            callManager = new DailyCallManager();
            callManager.joinCallback = joinCallCallback;
            setDailyCallManager(callManager);
        }
    }, [socket, selectedRoom, user, dailyCallManager]);

    useEffect(() => {
        console.log({videoModal, toggleVideoCall})
        if(videoModal) {
            if (toggleVideoCall) {
                videoModal.show();
            } else {
                videoModal.hide();
            }
        }
    }, [toggleVideoCall, videoModal]);

    useEffect(() => {
        if(socket && selectedRoom && toggleVideoCall) {
            socket.emit('broadcast', {
                eventName: "incoming-call",
                payload: {...selectedRoom}
            });
        }
    }, [socket, selectedRoom, toggleVideoCall]);

    const joinCallCallback = () => {
        setHasJoined(true);
    }

    const createPeerConnection = (targetId) => {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        pcRef.current = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", { to: targetId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            remoteVideoRef.current.srcObject = event.streams[0];
        };

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            localVideoRef.current.srcObject = stream;
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        });

        return pc;
    };

    const startCall = async () => {
        /*
        const to = Object.keys(selectedRoom.users).filter(k => parseInt(k, 10) !== parseInt(user.id, 10))[0];
        const pc = createPeerConnection(remoteSocketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

         */
        socket.emit('broadcast', {
            eventName: "incoming-call",
            payload: {...selectedRoom}
        });
        // socket.emit("call-user", { to, offer });
    };

    const endCall = () => {
        /*
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        */

        if(videoModal) {
            videoModal.hide();
        }

        console.log({dailyCallManager});
        setToggleVideoCall(false);
        setRoomUrl(null);
        setHasJoined(false);
        if(dailyCallManager) {
            dailyCallManager.leave().then(() => {
                console.log({toggleVideoCall});
                console.log({toggleVideoCall});
            });
        }
    };

    return (
        <div className="modal fade" tabIndex="-1" id="videoCallingScreen" data-bs-backdrop="static" data-bs-keyboard="false">
            <div className="modal-dialog modal-dialog-centered modal-sm">
                <div className="modal-content border-0">
                    <div className="tyn-chat-call tyn-chat-call-video">
                        <div className="tyn-chat-call-stack">
                            <div className="tyn-chat-call-cover relative local-video-container">
                                <img src="assets/images/v-cover/1.jpg" alt=""/>
                                <video
                                    ref={localVideoRef}
                                    autoPlay muted playsInline
                                    className="video-element object-cover absolute w-full h-full top-0 left-0"
                                    style={{display: `${!hasJoined ? 'none' : ''}`}}
                                />
                            </div>
                        </div>
                        <div className="tyn-chat-call-stack on-dark">
                            <div className="tyn-media-group p-4">
                                <div className="tyn-media-col align-self-start pt-3">
                                    <div className="tyn-media-row has-dot-sap">
                                        <span className="meta">Talking With ...</span>
                                    </div>
                                    <div className="tyn-media-row">
                                        <h6 className="name">Konstantin Frank</h6>
                                    </div>
                                    <div className="tyn-media-row has-dot-sap">
                                        <span className="content">02:09 min</span>
                                    </div>
                                </div>
                                <div className="tyn-media tyn-media-1x1_3 tyn-size-3xl border border-2 border-dark relative remote-video-container">
                                    <img src="assets/images/v-cover/2.jpg" alt=""/>
                                    <video ref={remoteVideoRef} autoPlay playsInline className="video-element object-cover absolute w-full h-full top-0 left-0" />
                                </div>
                            </div>
                            <ul className="tyn-list-inline gap gap-3 mx-auto py-4 justify-content-center  mt-auto">
                                <li>
                                    <button className="btn btn-icon btn-pill btn-light">

                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-plus-fill" viewBox="0 0 16 16">
                                            <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                                            <path fillRule="evenodd" d="M13.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5z" />
                                        </svg>
                                    </button>
                                </li>
                                <li>
                                    <button className="btn btn-icon btn-pill btn-light" data-bs-toggle="modal" data-bs-target="#callingScreen" onClick={startCall}>

                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-camera-video-fill" viewBox="0 0 16 16">
                                            <path fillRule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z" />
                                        </svg>
                                    </button>
                                </li>
                                <li>
                                    <button className="btn btn-icon btn-pill btn-light">

                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-mic-mute-fill" viewBox="0 0 16 16">
                                            <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3z" />
                                            <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z" />
                                        </svg>
                                    </button>
                                </li>
                                <li>
                                    <button className="btn btn-icon btn-pill btn-danger" data-bs-dismiss="modal" onClick={endCall}>

                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-telephone-x-fill" viewBox="0 0 16 16">
                                            <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511zm9.261 1.135a.5.5 0 0 1 .708 0L13 2.793l1.146-1.147a.5.5 0 0 1 .708.708L13.707 3.5l1.147 1.146a.5.5 0 0 1-.708.708L13 4.207l-1.146 1.147a.5.5 0 0 1-.708-.708L12.293 3.5l-1.147-1.146a.5.5 0 0 1 0-.708z" />
                                        </svg>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div>
                    <label htmlFor="room-url">Room URL:</label>
                    <input
                        type="text"
                        id="room-url"
                        size="50"
                        value="https://mesdoh.daily.co/hello"
                        placeholder="https://mesdoh.daily.co/hello"
                    />
                </div>
                <div>
                    <label htmlFor="join-token">
                        <a
                            href="https://docs.daily.co/guides/configurations-and-settings/controlling-who-joins-a-meeting"
                            target="_blank"
                        >Meeting token:</a
                        >
                    </label>
                    <input type="text" id="join-token" size="50" placeholder="Optional"/>
                </div>

                <div className="controls">
                    <button id="join-btn">Join Room</button>
                    <button id="leave-btn" disabled>Leave</button>
                </div>

                <div className="controls">
                    <button id="toggle-camera" disabled="true">Toggle Camera</button>
                    <button id="toggle-mic" disabled="true">Toggle Microphone</button>
                </div>

                <div className="controls">
                    <select id="camera-selector">
                        <option value="" disabled selected>Select a camera</option>
                    </select>
                    <select id="mic-selector">
                        <option value="" disabled selected>Select a microphone</option>
                    </select>
                </div>

                <div id="status">
                    <div id="camera-state">Camera: Off</div>
                    <div id="mic-state">Mic: Off</div>
                    <div id="participant-count">Participants: 0</div>
                    <div id="active-speaker">Active Speaker: None</div>
                </div>

                <div id="videos"/>
            </div>
        </div>
    )
}
