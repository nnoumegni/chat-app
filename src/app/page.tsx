"use client"

import {useUserStore} from "./store/App.store";
import AuthFormComponent from "./components/AuthForm/AuthFormComponent";
import Home from "./pages/home/Home";


const App = () => {
  const { showAuthPage, setShowAuthPage } = useUserStore();

  return (
    <>
      {showAuthPage && (<AuthFormComponent handleSignIn={() => setShowAuthPage()} />)}
      {!showAuthPage && (<Home />)}
    </>
  );
}

export default App;
