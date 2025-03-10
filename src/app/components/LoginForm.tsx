import {useCallback, useEffect, useRef} from "react";
import {useFetchData} from "../api/fetch-data";
import {useAppStore} from "../store/use-app.store";

export const LoginForm = ({toggleForm}) => {
    const usernameInput = useRef();
    const passwordInput = useRef();
    const { loading, error, data, handleApiCall } = useFetchData();
    const {setUser, setIsAuthenticated} = useAppStore();

    const submitHandler = useCallback((evt) => {
        evt.preventDefault();
        const {value: username} = usernameInput.current;
        const {value: password} = passwordInput.current;

        if(!(username && password)) { return; }

        handleApiCall({
            path: 'account',
            action: 'doLogin',
            token: `${new Date().getTime()}`,
            data: {username, password}
        }).then(({user}) => {
            if(user) {
                setUser({user});
                setIsAuthenticated({isAuthenticated: true});
            }
        })
    }, []);

    useEffect(() => {
        const authData = localStorage.getItem('authData');
        if(authData) {
            const {username, token} = JSON.parse(authData);
            handleApiCall({
                path: 'account',
                action: 'doLogin',
                data: {username, token}
            }).then(({user}) => {
                if (user) {
                    setUser({user});
                    setIsAuthenticated({isAuthenticated: true});
                }
            });
        }
    }, []);

    return (
        <form onSubmit={submitHandler}>
            <div className="max-w-lg w-full p-6 mx-auto ng-untouched ng-pristine ng-invalid">
                <div className="mb-12">
                    <h3 className="text-gray-800 text-xl font-extrabold">
                        Sign In - Chat App
                        {error && <div className="text-pink-800">There was an error</div>}
                        {data && !data.success && <div className="text-pink-800">Oops. Account not found</div>}
                    </h3>
                </div>
                <div className="relative flex items-center">
                    <label className="text-gray-800 text-[13px] bg-white absolute px-2 top-[-9px] left-[18px] font-semibold">
                        Username
                    </label>
                    <input
                        ref={usernameInput}
                        className="px-4 py-3.5 bg-white w-full text-sm border-2 border-gray-200 focus:border-blue-600 rounded-md outline-none ng-untouched ng-pristine ng-invalid"
                        placeholder="Your Username..." type="text"/>
                </div>
                <div className="relative flex items-center mt-8">
                    <label className="text-gray-800 text-[13px] bg-white absolute px-2 top-[-9px] left-[18px] font-semibold">
                        Password
                    </label>
                    <input
                        ref={passwordInput}
                        className="px-4 py-3.5 bg-white w-full text-sm border-2 border-gray-200 focus:border-blue-600 rounded-md outline-none ng-untouched ng-pristine ng-invalid"
                        placeholder="Your Password..."
                        type="password"/>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                    <div className="flex items-center">
                        <label className="ml-3 mb-0 block text-sm text-gray-800">
                            Dont have an account?
                        </label>
                    </div>
                    <div>
                        <label
                            className="text-blue-600 font-semibold text-sm hover:underline cursor-pointer"
                            onClick={() => toggleForm('register')}
                        >
                            Register Now
                        </label>
                    </div>
                </div>
                <div className="mt-12">
                    <button className="w-full shadow-xl py-2.5 px-4 text-sm tracking-wider font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                            type="submit"
                    >
                        {!loading && <span>Sign in</span>}
                        {loading && <span>Please wait...</span>}
                    </button>
                </div>
            </div>
        </form>
    )
}
