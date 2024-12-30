import { useRef } from 'react'
import {useUserStore} from "../../store/App.store";

export default function SigninTabContentComponent({ showForgetTab, onSignin }) {
  const { user: currentUserState, setUser: updateUserState } = useUserStore();
  const { username, password } = currentUserState || {}
  const usernameRef = useRef(), passwordRef = useRef();
  const handleSubmit = (evt) => {
    evt.preventDefault();

    onSignin({
      username: usernameRef.current.value,
      password: passwordRef.current.value,
    });
  }

  const handleChange = () => {
    const {
      current: { value: username },
    } = usernameRef;

    const {
      current: { value: password },
    } = passwordRef;

    const payload = { username, password };

    updateUserState({payload, action: 'update'});
  }

  return (
    <>
      <div id="cd-login" className="is-selected">
        <form
          className="cd-form login-form ng-pristine ng-invalid ng-touched"
          name="loginForm"
          noValidate=""
          onSubmit={handleSubmit}
        >
          {/**/}
          <p className="fieldset">
            <label
              className="image-replace cd-username"
              htmlFor="signin-username"
            >
              Username
            </label>
            <input
              autoCapitalize="off"
              className="full-width has-padding has-border ng-pristine ng-invalid ng-touched"
              id="signin-username"
              name="username"
              required=""
              type="text"
              placeholder="Username"
              value={username}
              ref={usernameRef}
              onChange={handleChange}
            />
            <span className="cd-error-message">Error message here!</span>
          </p>
          <p className="fieldset">
            <label
              className="image-replace cd-password"
              htmlFor="signin-password"
            >
              Password
            </label>
            <input
              className="full-width has-padding has-border ng-untouched ng-pristine ng-invalid"
              id="signin-password"
              name="password"
              required=""
              type="password"
              placeholder="Password"
              value={password}
              ref={passwordRef}
              onChange={handleChange}
            />
            <i aria-hidden="true" className="fa fa-eye-slash fa-lg" />
            <span className="cd-error-message">Error message here!</span>
          </p>
          <p className="fieldset">
            <input
              className="full-width"
              id="submit-login"
              type="submit"
              defaultValue="Login"
            />
          </p>
        </form>
        <p className="cd-form-bottom-message">
          {/**/}
          <a href="#" onClick={showForgetTab}>
            Forgot password?
          </a>
          {/**/}
        </p>
      </div>
    </>
  )
}
