import type { FormEventHandler } from "react";
import {
  ADMIN_APP_URL,
  API_APP_URL,
  STAFF_APP_URL,
  type BackOfficeSession
} from "../../lib/api";

type AuthFormState = {
  email: string;
  password: string;
};

type StorefrontAccessViewProps = {
  backOfficeSession: BackOfficeSession | null;
  authForm: AuthFormState;
  authState: string | null;
  authStateTone: "success" | "error";
  isAuthPending: boolean;
  onAuthFieldChange: (field: keyof AuthFormState, value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onSignOut: () => void;
  onOpenDashboard: (url: string) => void;
};

export function StorefrontAccessView({
  backOfficeSession,
  authForm,
  authState,
  authStateTone,
  isAuthPending,
  onAuthFieldChange,
  onSubmit,
  onSignOut,
  onOpenDashboard
}: StorefrontAccessViewProps) {
  return (
    <section className="access-view">
      <section className="access-hero">
        <div>
          <p className="section-kicker">Back office access</p>
          <h1>Sign in to the backend from the website.</h1>
          <p className="hero-lead">
            Use your staff or admin credentials once here, then launch the admin and staff
            dashboards with the same session.
          </p>
        </div>
      </section>

      <div className="access-layout">
        <section className="content-panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Authentication</p>
              <h2>{backOfficeSession ? "Session active" : "Sign in"}</h2>
            </div>
          </div>

          {backOfficeSession ? (
            <div className="access-card">
              <div className="access-session-head">
                <div>
                  <strong>
                    {backOfficeSession.user.firstName} {backOfficeSession.user.lastName}
                  </strong>
                  <p>{backOfficeSession.user.email}</p>
                </div>
                <span className="session-pill">Connected</span>
              </div>
              <div className="access-meta">
                <div>
                  <span>Roles</span>
                  <strong>
                    {backOfficeSession.user.roles.length
                      ? backOfficeSession.user.roles.join(", ")
                      : "staff"}
                  </strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{backOfficeSession.user.status ?? "active"}</strong>
                </div>
              </div>
              <div className="access-actions">
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => onOpenDashboard(ADMIN_APP_URL)}
                >
                  Open Admin
                </button>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => onOpenDashboard(STAFF_APP_URL)}
                >
                  Open Staff
                </button>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => onOpenDashboard(API_APP_URL)}
                >
                  Open API
                </button>
              </div>
              <button
                type="button"
                className="text-link text-link-inline"
                onClick={onSignOut}
              >
                {isAuthPending ? "Signing out..." : "Sign out"}
              </button>
            </div>
          ) : (
            <form className="checkout-form" onSubmit={onSubmit}>
              <label className="field">
                Email
                <input
                  className="text-input"
                  type="email"
                  value={authForm.email}
                  onChange={event => onAuthFieldChange("email", event.target.value)}
                  required
                />
              </label>
              <label className="field">
                Password
                <input
                  className="text-input"
                  type="password"
                  value={authForm.password}
                  onChange={event => onAuthFieldChange("password", event.target.value)}
                  required
                />
              </label>
              <button type="submit" className="primary-action" disabled={isAuthPending}>
                {isAuthPending ? "Signing in..." : "Sign in to backend"}
              </button>
              <p className="checkout-note">
                This uses the existing staff/admin backend login and shares the session with
                the admin and staff apps.
              </p>
            </form>
          )}

          {authState ? (
            <p
              className={
                authStateTone === "error"
                  ? "inline-message inline-message-error"
                  : "inline-message inline-message-success"
              }
            >
              {authState}
            </p>
          ) : null}
        </section>

        <aside className="content-panel access-side">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Launch points</p>
              <h2>Where this signs you in</h2>
            </div>
          </div>
          <div className="access-link-list">
            <div className="access-link-card">
              <strong>Admin dashboard</strong>
              <span>{ADMIN_APP_URL}</span>
            </div>
            <div className="access-link-card">
              <strong>Staff console</strong>
              <span>{STAFF_APP_URL}</span>
            </div>
            <div className="access-link-card">
              <strong>API root</strong>
              <span>{API_APP_URL}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
