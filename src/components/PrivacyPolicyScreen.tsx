// English-only by design (see translations.ts note on settingsPrivacyLink) -
// accurately translating a legal document into 16 languages is out of
// scope; showing it consistently in one language beats an inconsistent
// partial translation.
export function PrivacyPolicyScreen() {
  return (
    <div className="privacy-policy">
      <h2>Privacy Policy</h2>
      <p className="privacy-updated">Last updated: this is a demo build - update this date when real billing/ads go live.</p>

      <h3>Location</h3>
      <p>
        "Closest Station" uses your browser's geolocation to find nearby stops. Your location is used
        only to sort results on your own device and is sent only as part of the request to Transport
        for NSW's API to find stops near that coordinate - we don't store it or send it anywhere else.
      </p>

      <h3>Data stored on your device</h3>
      <p>
        Favorites, sign-in email, and subscription status are stored only in your browser's local
        storage on this device. They are not transmitted to or stored on any server we control, and
        clearing your browser data or using "Reset all local demo data" in Settings removes them
        completely.
      </p>

      <h3>Third-party services</h3>
      <ul className="privacy-list">
        <li>
          <strong>Transport for NSW</strong> - station search, departures, and trip planning are
          powered by their Open Data API. See their own privacy policy for how they handle requests.
        </li>
        <li>
          <strong>OpenStreetMap</strong> - the map picker loads map tiles from OpenStreetMap's
          servers, which may log standard web request data (e.g. IP address) per their usage policy.
        </li>
        <li>
          <strong>Google AdSense</strong> - if ads are shown, Google and its partners may use cookies
          or similar identifiers to serve and measure ads, which may include personalised advertising
          based on your browsing activity. You can review or opt out of personalised ads at{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
            Google Ads Settings
          </a>
          , and learn more at{' '}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">
            How Google uses data from sites that use its services
          </a>
          .
        </li>
      </ul>

      <h3>Contact</h3>
      <p>
        <strong>Support Sydney Transit</strong>
      </p>
      <p>
        For donations, sponsorship opportunities or partnerships, contact us at{' '}
        <a href="mailto:652779676@qq.com">652779676@qq.com</a>.
      </p>
    </div>
  );
}
