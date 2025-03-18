export const MuteOptionsModal = () => {
    return (
        <div className="modal fade" tabIndex="-1" id="muteOptions">
            <div className="modal-dialog modal-dialog-centered modal-sm">
                <div className="modal-content border-0">
                    <div className="modal-body p-4">
                        <h4 className="pb-2">Mute conversation</h4>
                        <ul className="tyn-media-list gap gap-2">
                            <li>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="muteFor" id="muteFor15min"/>
                                        <label className="form-check-label" htmlFor="muteFor15min"> For 15 minutes </label>
                                </div>
                            </li>
                            <li>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="muteFor" id="muteFor1Hour" checked/>
                                        <label className="form-check-label" htmlFor="muteFor1Hour"> For 1 Hours </label>
                                </div>
                            </li>
                            <li>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="muteFor" id="muteFor1Days" checked/>
                                        <label className="form-check-label" htmlFor="muteFor1Days"> For 1 Days </label>
                                </div>
                            </li>
                            <li>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="muteFor" id="muteForInfinity" checked/>
                                        <label className="form-check-label" htmlFor="muteForInfinity"> Until I turn back On </label>
                                </div>
                            </li>
                        </ul>
                        <ul className="tyn-list-inline gap gap-3 pt-3">
                            <li>
                                <button className="btn btn-md btn-danger js-chat-mute">Mute</button>
                            </li>
                            <li>
                                <button className="btn btn-md btn-light" data-bs-dismiss="modal">Close</button>
                            </li>
                        </ul>
                    </div>
                    <button className="btn btn-md btn-icon btn-pill btn-white shadow position-absolute top-0 end-0 mt-n3 me-n3" data-bs-dismiss="modal">

                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
                            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
