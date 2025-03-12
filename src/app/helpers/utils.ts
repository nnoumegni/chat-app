import {Room, User} from "../models/chat-models";

export class Utils {
    static formattedRoom({room, currentUser}: {room: Room; currentUser: User}) {
        const userData = room.users;
        const keys = Object.keys(userData).map(key => parseInt(key, 10));
        const isDm = room.type === 'dm';

        if(isDm) {
            let dmUser;
            // If Im DM myself
            if (keys.length === 1) {
                if (userData) {
                    dmUser = userData[currentUser.id];
                }
            } else if (keys.length === 2) {
                const index = keys.findIndex(key => key !== currentUser.id);
                console.log(keys, index);
                if (index !== -1) {
                    const userKey = keys[index];
                    if (userData) {
                        dmUser = userData[userKey];
                    }
                }
            }

            room.name = dmUser.fullName;
        }

        return room;
    }
}
