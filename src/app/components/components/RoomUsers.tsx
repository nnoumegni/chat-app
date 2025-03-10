import {useEffect, useState} from "react";
import {useFetchData} from "../api/fetch-data";
import {useAppStore} from "../store/use-app.store";
import {User} from "../models/chat-models";
import {Loader} from "./Loader";

export const UserList = (roomId) => {
    const [userList, setUserList] = useState([]);
    const {loading,  handleApiCall} = useFetchData();
    const {isAuthenticated, user} = useAppStore();

    useEffect(() => {
        if(isAuthenticated) {
            const {id: userId, token} = user;
            if(roomId) {
                handleApiCall({
                    path: 'chat',
                    action: 'getUsers',
                    token,
                    data: {userId}
                }).then((items: User[]) => {
                    setUserList(items);
                })
            }
        }
    }, [roomId]);

    if(loading) {
        return <Loader/>
    }

    return (
        <ul>
            {userList.map((room, index) => {
                const {name, id} = room;
                return <li key={id}>{ name }</li>
            })}
        </ul>
    )
}
