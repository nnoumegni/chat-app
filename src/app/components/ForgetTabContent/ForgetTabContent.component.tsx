export default function ForgetTabContentComponent({ setHomeTab }) {
  return (
    <>
      <div id="cd-reset-password">
        <p className="cd-form-message"> Retrieve your password. </p>
        <form
          className="cd-form ng-untouched ng-pristine ng-valid"
          noValidate=""
        >
          <p className="fieldset">
            <label className="image-replace cd-email" htmlFor="reset-email">
              E-mail
            </label>
            <input
              className="full-width has-padding has-border"
              id="reset-email"
              placeholder="E-mail"
              type="email"
            />
            <span className="cd-error-message">Error message here!</span>
          </p>
          <p className="fieldset">
            <input
              className="full-width has-padding"
              type="submit"
              defaultValue="Send my password"
            />
          </p>
        </form>
        <p className="cd-form-bottom-message">
          {/**/}
          <a href="#" onClick={setHomeTab}>
            Back to log-in
          </a>
          {/**/}
        </p>
      </div>
    </>
  )
}
