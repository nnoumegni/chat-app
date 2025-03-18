import {UnAuthLayout} from "./layouts/UnauthLayout";
import {AuthLayout} from "./layouts/AuthLayout";
import {useAppStore} from "./store/use-app.store";
import { useEffect } from "react";
import {Utils} from "./helpers/utils";

export const ChatApp = () => {
    const {isAuthenticated, setIsAuthenticated, setUser, deviceId, setDeviceId} = useAppStore();

    useEffect(() => {
        const authData = localStorage.getItem('authData');
        if(authData) {
            const {username, token, user} = JSON.parse(authData);
            if(user) {
                setUser({user});
                setIsAuthenticated({isAuthenticated: true});
            }
        }

        Utils.setBrowserDeviceId().then((uuid) => {
            setDeviceId({deviceId: uuid});
        });
    }, [deviceId]);

    return (
        <>
            {!isAuthenticated && <UnAuthLayout/>}
            {isAuthenticated && <AuthLayout/>}
        </>
    )
}
