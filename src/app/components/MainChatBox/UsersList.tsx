import React, {useCallback, useEffect, useRef} from "react";
import { Loader } from "../Loader";
import {Utils} from "../../helpers/utils";
import {useFetchData} from "../../api/fetch-data";
import {useAppStore} from "../../store/use-app.store";
import {DmRoom, RoomUser, User} from "../../models/chat-models";
import {ProfileAvatar} from "./ProfileAvatar";

export const UsersList = ({isModal = false, handleRoomClick}) => {
    const {loading,  handleApiCall} = useFetchData();
    const {user, users, selectedUsers, roomType, addSelectedUser, setUsers, setShowNewRoomForm} = useAppStore();
    const searchFieldRef = useRef();
    const defaultCls = isModal ? 'max-h-[300px]' : 'flex-1';

    const searchUsers = (q = '') => {
        const {id: userId, token} = user;
        handleApiCall({
            path: 'chat',
            action: 'searchUsers',
            token,
            data: {q}
        }).then((items: User[]) => {
            setUsers({users: items});
        });
    }

    useEffect(() => {
        searchUsers()
    }, []);

    const handleSearch = useCallback((evt) => {
        evt.preventDefault();

        const {value} = searchFieldRef.current;
        if(value && value.trim()) {
            searchUsers(value.trim());
        }
    }, []);

    const handleUserClicked = useCallback(({user: dmUser}: {user: RoomUser}) => {
        const roomUser: DmRoom = Utils.roomUserMapper({user: dmUser, currentUser: user});
        if(roomType === 'dm') {
            handleRoomClick({room: roomUser});
            setShowNewRoomForm({showNewRoomForm: false});
        } else if(roomType === 'group') {
            addSelectedUser({user: roomUser})
        }
    }, [roomType]);

    return (
        <div className="flex flex-col flex-1">
            <h4 className="pb-2">Search by Name</h4>
            <div className="form-group">
                <div className="form-control-wrap">
                    <div className="form-control-icon start">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                    </div>
                    <form onSubmit={handleSearch}>
                        <input
                            ref={searchFieldRef}
                            type="text"
                            className="form-control form-control-solid pl-[2em]"
                            id="search-contact"
                            placeholder="Search contact"
                            style={{paddingLeft: '2.5em'}}
                        />
                    </form>
                </div>
            </div>
            <div className={'tyn-media-list gap gap-3 pt-4 h-[300px] flex-1 relative ' + defaultCls}>
                <div className="overflow-auto absolute h-full w-full">
                    <ul className={'tyn-media-list gap gap-3'}>
                        {loading && (
                            <Loader/>
                        )}
                        {!loading && users.map((user: RoomUser, index = 0) => {
                            const {fullname, thumb} = user;
                            return (
                                <li key={index} className="cursor-pointer" onClick={() => handleUserClicked({user})}>
                                    <div className="tyn-media-group">
                                        <div className="tyn-media">
                                            <ProfileAvatar thumb={thumb} fullname={fullname}/>
                                        </div>
                                        <div className="tyn-media-col">
                                            <div className="tyn-media-row">
                                                <h6 className="name capitalize">{fullname}</h6>
                                            </div>
                                            <div className="tyn-media-row">
                                                <p className="content">@{fullname}</p>
                                            </div>
                                        </div>
                                        <ul className="tyn-media-option-list me-n1">
                                            <li className="dropdown">
                                                <button className="btn btn-icon btn-white btn-pill dropdown-toggle" data-bs-toggle="dropdown" data-bs-offset="0,0" data-bs-auto-close="outside">

                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots" viewBox="0 0 16 16">
                                                        <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                                                    </svg>
                                                </button>
                                                <div className="dropdown-menu dropdown-menu-end">
                                                    <ul className="tyn-list-links">
                                                        <li>
                                                            <button data-bs-dismiss="modal">

                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chat-left-text" viewBox="0 0 16 16">
                                                                    <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                                                                    <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                                                                </svg>
                                                                <span>Start Texting</span>
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <a href="#callingScreen" data-bs-toggle="modal">

                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-telephone" viewBox="0 0 16 16">
                                                                    <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
                                                                </svg>
                                                                <span>Audio Call</span>
                                                            </a>
                                                        </li>
                                                        <li>
                                                            <a href="#videoCallingScreen" data-bs-toggle="modal">

                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-camera-video" viewBox="0 0 16 16">
                                                                    <path fillRule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556v4.35zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H2z" />
                                                                </svg>
                                                                <span>Video Call</span>
                                                            </a>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        </div>
    )
}
