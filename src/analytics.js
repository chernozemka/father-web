// Thin wrapper around GoatCounter's custom-event API (loaded in index.html).
// Safe no-op if the script is blocked or hasn't loaded yet.
export function track(name, title) {
  window.goatcounter?.count?.({
    path: name, // shows up as the event name in the dashboard
    title: title ?? name,
    event: true,
  })
}
