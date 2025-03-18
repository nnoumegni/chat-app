export const DeleteChatModal = () => {
    return (
        <div className="modal fade" tabIndex="-1" id="deleteChat">
            <div className="modal-dialog modal-dialog-centered modal-sm">
                <div className="modal-content border-0">
                    <div className="modal-body">
                        <div className="py-4 px-4 text-center">
                            <h3>Delete chat</h3>
                            <p className="small">Once you delete your copy of this conversation, it cannot be undone.</p>
                            <ul className="tyn-list-inline gap gap-3 pt-1 justify-content-center">
                                <li>
                                    <button className="btn btn-danger" data-bs-dismiss="modal">Delete</button>
                                </li>
                                <li>
                                    <button className="btn btn-light" data-bs-dismiss="modal">No</button>
                                </li>
                            </ul>
                        </div>
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
