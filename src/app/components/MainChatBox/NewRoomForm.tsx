import {useAppStore} from "../../store/use-app.store";
import {AddRoom, RoomUser} from "../../models/chat-models";
import {useRef} from "react";
import {useFetchData} from "../../api/fetch-data";
import {UsersList} from "./UsersList";

export const NewRoomForm = ({handleRoomClick}) => {
    const {setShowNewRoomForm, addRoom, user, roomType, setSelectedRoom} = useAppStore();
    const roomNameInputRef = useRef();
    const { handleApiCall, loading } = useFetchData();

    const handleAddRoom = (evt) => {
        evt.preventDefault();
        const {value: name} = roomNameInputRef.current;

        if(name && name.trim()) {
            const roomUser: RoomUser = {userId: user.id, fullname: user.fullname};
            const users: any = {[user.id]: roomUser};
            const room: AddRoom = {name, addedBy: user.id, users, active: 1};

            handleApiCall({
                path: 'chat',
                action: 'addRoom',
                token: `${new Date().getTime()}`,
                data: room
            }).then((resp) => {
                const {room, success} = resp;
                if(success) {
                    // let's prepend the new room to the current list of rooms
                    addRoom({room});
                    evt.target.reset();
                    setShowNewRoomForm({showNewRoomForm: false});
                    setSelectedRoom({room})
                }
            }, err => console.log(err));
        }
    };

    return (
        <>
            {roomType === 'group' && (
                <form className="tyn-aside-head flex-col items-between pt-0" style={{alignItems: 'normal'}} onSubmit={handleAddRoom}>
                    <label className="mb-2 text-sm block cursor-pointer" onClick={() => setShowNewRoomForm({showNewRoomForm: false})}>
                        &larr; Return
                    </label>
                    <div className="flex items-center justify-between">
                        <input ref={roomNameInputRef} type="text" placeholder="Room name..." className="px-4 py-1.5 text-sm rounded-md bg-white border border-gray-400 w-full outline-blue-500"/>
                        <button
                            type="submit"
                            className="px-2 ml-2 py-1.5 text-sm border-none outline-none text-green-600 bg-green-100 hover:bg-green-200 rounded"
                        >
                            Save
                        </button>
                    </div>
                </form>
            )}
            <div className="flex flex-1 mx-[1em]">
                <UsersList handleRoomClick={handleRoomClick}/>
            </div>
        </>
    )
}