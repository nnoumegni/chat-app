export const VideoCallModal = () => {
    return (
        <div className="modal fade" tabIndex="-1" id="videoCallingScreen" data-bs-backdrop="static" data-bs-keyboard="false">
            <div className="modal-dialog modal-dialog-centered modal-sm">
                <div className="modal-content border-0">
                    <div className="tyn-chat-call tyn-chat-call-video">
                        <div className="tyn-chat-call-stack">
                            <div className="tyn-chat-call-cover">
                                <img src="assets/images/v-cover/1.jpg" alt=""/>
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
                                <div className="tyn-media tyn-media-1x1_3 tyn-size-3xl border border-2 border-dark">
                                    <img src="assets/images/v-cover/2.jpg" alt=""/>
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
                                    <button className="btn btn-icon btn-pill btn-light" data-bs-toggle="modal" data-bs-target="#callingScreen">

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
                                    <button className="btn btn-icon btn-pill btn-danger" data-bs-dismiss="modal">

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
        </div>
    )
}
