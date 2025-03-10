import {useCallback, useEffect, useRef, useState} from "react";
import {useFetchData} from "../api/fetch-data";
import {LoginForm} from "../components/LoginForm";
import {RegisterForm} from "../components/RegisterForm";

export const UnAuthLayout = () => {
    const [type, setType] = useState('login');

    const toggleForm = (type) => {
        setType(type);
    }

    return (
        <div className="fixed inset-0 p-4 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto font-[sans-serif]">
            <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-8 relative">
                <i className="fa fa-eye"/>
                <div className="font-[sans-serif] bg-white">
                    <div className="grid items-center">
                        {type === 'login' && <LoginForm toggleForm={toggleForm}/>}
                        {type === 'register' && <RegisterForm toggleForm={toggleForm}/>}
                    </div>
                </div>
            </div>
        </div>
    )
}
