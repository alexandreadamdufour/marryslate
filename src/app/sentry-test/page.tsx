"use client"

export default function SentryTestPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Test Sentry</h1>
      <p className="text-sm text-muted-foreground">
        Cette page teste l&apos;intégration Sentry. À supprimer après validation.
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
          onClick={() => {
            throw new Error("Sentry integration test — safe to ignore")
          }}
        >
          Trigger Sentry test error
        </button>
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          onClick={() => {
            Promise.reject(new Error("Sentry unhandled rejection test"))
          }}
        >
          Trigger unhandled promise rejection
        </button>
      </div>
    </div>
  )
}
