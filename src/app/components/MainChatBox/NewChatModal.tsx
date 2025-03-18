import {UsersList} from "./UsersList";

export const NewChatModal = () => {
    return (
        <div className="modal fade" tabIndex={-1} id="newChat">
            <div className="modal-dialog modal-dialog-centered modal-sm">
                <div className="modal-content border-0">
                    <div className="modal-body p-4">
                        <UsersList isModal={true}/>
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
