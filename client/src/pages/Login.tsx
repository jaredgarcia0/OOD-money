import type React from "react";
import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasVisualAsset, setHasVisualAsset] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailId = useId();
  const passwordId = useId();
  const formErrorId = useId();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim();
    const nextEmailError = normalizedEmail
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ? ""
        : "Enter a valid email address."
      : "Email is required.";
    const nextPasswordError = password ? "" : "Password is required.";

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    setIsSubmitting(true);
    try {
      await login(normalizedEmail, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "We couldn't sign you in. Check your details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel__inner">
          <a className="login-brand" href="/login" aria-label="NexaVerse home">
            <span className="login-brand__mark" aria-hidden="true">
              <span />
              <span />
            </span>
            <span>OOD-Money</span>
          </a>

          <div className="login-copy">
            <p className="eyebrow">Welcome back</p>
            <h1 id="login-title">Your money, in motion.</h1>
            <p className="login-copy__intro">
              Sign in to pick up where you left off and keep your financial
              momentum going.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
            noValidate
            aria-describedby={error ? formErrorId : undefined}
          >
            {error && (
              <div className="login-alert" id={formErrorId} role="alert">
                <span className="login-alert__icon" aria-hidden="true">
                  !
                </span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-field">
              <label htmlFor={emailId}>Email address</label>
              <input
                id={emailId}
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                  if (error) setError("");
                }}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@example.com"
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? `${emailId}-error` : undefined}
                className={emailError ? "has-error" : ""}
              />
              {emailError && (
                <p className="field-error" id={`${emailId}-error`}>
                  {emailError}
                </p>
              )}
            </div>

            <div className="form-field">
              <div className="form-field__label-row">
                <label htmlFor={passwordId}>Password</label>
                <a href="mailto:support@nexaverse.local?subject=Reset%20password">
                  Forgot password?
                </a>
              </div>
              <div className="password-input">
                <input
                  id={passwordId}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                    if (error) setError("");
                  }}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={
                    passwordError ? `${passwordId}-error` : undefined
                  }
                  className={passwordError ? "has-error" : ""}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  <span aria-hidden="true">{showPassword ? "Hide" : "Show"}</span>
                </button>
              </div>
              {passwordError && (
                <p className="field-error" id={`${passwordId}-error`}>
                  {passwordError}
                </p>
              )}
            </div>

            <label className="remember-me">
              <input type="checkbox" name="remember" />
              <span className="remember-me__box" aria-hidden="true" />
              <span>Keep me signed in</span>
            </label>

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              <span>{isSubmitting ? "Signing you in…" : "Sign in"}</span>
              {!isSubmitting && <span aria-hidden="true">→</span>}
            </button>

            <p className="login-signup">
              New to NexaVerse? <a href="/register">Create an account</a>
            </p>
          </form>

          <p className="login-footer">Secure access to your personal finances</p>
        </div>
      </section>

      <aside className="login-visual" aria-label="NexaVerse money management">
        <div className="login-visual__orb login-visual__orb--top" aria-hidden="true" />
        <div className="login-visual__orb login-visual__orb--bottom" aria-hidden="true" />
        <div className="login-visual__content">
          <p className="eyebrow eyebrow--light">Make every dollar count</p>
          <h2>Small steps.<br />Big momentum.</h2>
          <p className="login-visual__copy">
            A clearer view of today makes room for a more confident tomorrow.
          </p>
          <div className="login-visual__art">
            <img
              src="/valerina-hippo-money.png"
              alt=""
              aria-hidden="true"
              onLoad={() => setHasVisualAsset(true)}
              onError={() => setHasVisualAsset(false)}
            />
            {!hasVisualAsset && (
              <div className="login-visual__art-placeholder" aria-hidden="true">
              <span>YOUR MONEY<br />YOUR MOMENTUM</span>
              </div>
            )}
          </div>
        </div>
        <div className="login-visual__quote">
          <span className="login-visual__quote-mark" aria-hidden="true">“</span>
          <p>Clarity turns good intentions into habits.</p>
        </div>
      </aside>
    </main>
  );
}
