import {UnAuthLayout} from "./layouts/UnauthLayout";
import {AuthLayout} from "./layouts/AuthLayout";
import {useState} from "react";
import {useAppStore} from "./store/use-app.store";

export const ChatApp = () => {
    const {isAuthenticated} = useAppStore();

    return (
        <>
            {!isAuthenticated && <UnAuthLayout/>}
            {isAuthenticated && <AuthLayout/>}
        </>
    )
}
