Tracker is a static front-end deployable to github pages, and has a powerful backend.

It allows the following:
You create "trackers" which are made up of building blocks. I will go into more detail on this later. The public dashboard is read only which is a collection of cards which are the trackers. An example of a tracker might be that it looks like this:
- Open "https://chatgpt.com" in browser context 1. Browser context 1 was setup in the admin dashboard which is a peristant camoufox directory. The admin probably added cookies to this context.
- Look for regex in all network requests matching a specific regex.
- Update the card status if it found it.

The tracker should have an RSS feed exposed which updates when a tracker status is updated.

A few building blocks:
- Open <site> [in browser context x]
- Click <selector>
- Type <text> into <selector>
- Wait for <selector> to be visible
- Wait <seconds>
- Scroll to <selector>
- Grep <text>
- Grep <regex>
- Capture network request matching <regex>
- Convert document tree to markdown
- Extract text/attribute from <selector>
- Execute custom JavaScript
- Take screenshot
- Send notification (Discord/Slack/Webhook)
- Send HTTP Request (GET/POST/PUT/DELETE)
- Expect HTTP Status <code/range>
- Expect JSON Path <query> to match <regex/value>
- Solve CAPTCHA (Turnstile/hCaptcha/reCAPTCHA)
- Press Key (Enter, Escape, etc.)
- Refresh Page
- Set Custom Headers
- Clear Cookies/Cache
- Wait for Network Idle

**Logic & Control Flow:**
- If/Else Condition (based on previous step result or variable)
- Loop over elements (e.g., "For each element matching selector...")
- Wait (Randomized/Fixed)
- Retry on failure (Backoff strategy)

**Data Management:**
- Set Variable (from extraction or static value)
- Transform Variable (Regex replace, JSON parse, arithmetic)
- Save Cookie / Load Cookie Profile

**Architecture Overview:**

*   **Frontend (Static & SPA):**
    *   **Public Dashboard:** A static React app deployable to GitHub Pages. Fetches status via FastAPI.
    *   **Admin Dashboard:** React SPA for the No-Code visual editor.

*   **Backend (Python):**
    *   **Core:** FastAPI for high-performance async API.
    *   **Engine:** Integration with **Camoufox** via Playwright/Python.
    *   **Scheduler:** `APScheduler` for managing tracker intervals.
    *   **Database:** **SQLite** for metadata, configurations, and history.
    *   **API:** Serves the frontend and the RSS feed.

This should be a powerful no code interface for admins to easily setup versatile trackers.