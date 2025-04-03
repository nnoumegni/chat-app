import {UnAuthLayout} from "./layouts/UnauthLayout";
import {AuthLayout} from "./layouts/AuthLayout";
import {useAppStore} from "./store/use-app.store";
import { useEffect } from "react";
import {Utils} from "./helpers/utils";
import {Loader} from "./components/Loader";

export const ChatApp = () => {
    const {isAuthenticated, setIsAuthenticated, setUser, deviceId, setDeviceId} = useAppStore();

    useEffect(() => {
        Utils.getSessionData().then((authData: any) => {
            if(authData) {
                const {username, token, user} = authData;
                if(user && user.id) {
                    setUser({user});
                    setIsAuthenticated({isAuthenticated: true});
                } else {
                    setIsAuthenticated({isAuthenticated: false});
                }
            } else {
                setIsAuthenticated({isAuthenticated: false});
            }
        });

        Utils.setBrowserDeviceId().then((uuid) => {
            setDeviceId({deviceId: uuid});
        });
    }, [deviceId]);

    // Show the loader if the auth state is not yet set
    if(isAuthenticated === undefined) {
        return (
            <div className="flex items-start justify-center mt-5">
                <Loader/>
            </div>
        )
    }

    return (
        <>
            {!isAuthenticated && <UnAuthLayout/>}
            {isAuthenticated && <AuthLayout/>}
        </>
    )
}
