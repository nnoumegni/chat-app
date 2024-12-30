import { useRef } from 'react'
import {useUserStore} from "../../store/App.store";

export default function RegisterTabContentComponent() {
  const { user: currentUser, setUser: updateCurrentUser } = useUserStore();
  const { username, email, password } = currentUser || {}
  const usernameRef = useRef(),
    emailRef = useRef(),
    passwordRef = useRef()

  const handleChange = () => {
    const {
      current: { value: username },
    } = usernameRef;

    const {
      current: { value: password },
    } = passwordRef;

    const {
      current: { value: email },
    } = emailRef;
    
    updateCurrentUser({payload: { username, password, email }, action: ''})
  }

  return (
    <>
      <div id="cd-signup">
        <form
          className="cd-form ng-untouched ng-pristine ng-invalid"
          name="registerForm"
          noValidate=""
        >
          <p className="fieldset">
            <label
              className="image-replace cd-username"
              htmlFor="signup-username"
            >
              Username
            </label>
            <input
              autoComplete="off"
              className="full-width has-padding has-border ng-untouched ng-pristine ng-invalid"
              id="signup-username"
              maxLength={40}
              name="signup-username"
              required=""
              type="text"
              value={username}
              placeholder="Username"
              pattern="/^[a-zA-Z0-9]*$/"
              ref={usernameRef}
              onChange={handleChange}
            />
            <span className="cd-error-message">
              {/**/}
              <span>Username is required</span>
              {/**/}
              {/**/}
            </span>
          </p>
          <p className="fieldset">
            <label className="image-replace cd-email" htmlFor="signup-email">
              E-mail
            </label>
            <input
              autoComplete="off"
              className="full-width has-padding has-border ng-untouched ng-pristine ng-invalid"
              id="signup-email"
              name="signup-email"
              required=""
              type="email"
              value={email}
              placeholder="E-mail"
              pattern='/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/'
              ref={emailRef}
              onChange={handleChange}
            />
            <span className="cd-error-message">
              {/**/}
              <span>Email address is required!</span>
              {/**/}
            </span>
          </p>
          <p className="fieldset">
            <label
              className="image-replace cd-password"
              htmlFor="signup-password"
            >
              Password
            </label>
            <input
              className="full-width has-padding has-border ng-untouched ng-pristine ng-invalid"
              id="signup-password"
              name="signup-password"
              placeholder="Password"
              required=""
              type="password"
              value={password}
              ref={passwordRef}
              onChange={handleChange}
            />
            <i aria-hidden="true" className="fa fa-eye-slash fa-lg" />
            <span className="cd-error-message"> Password is required! </span>
          </p>
          <p className="fieldset">
            <input
              className="full-width has-padding"
              id="submit-register"
              type="submit"
              defaultValue="Create account"
            />
          </p>
        </form>
      </div>
    </>
  )
}
