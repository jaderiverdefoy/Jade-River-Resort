/**
 * Jade River Resort — booking form receiver (Google Apps Script)
 * =============================================================
 *
 * The website posts booking enquiries from /contact and from the homepage
 * "Reserve" popup to this script. The script emails the resort team, optionally
 * sends the guest a short acknowledgement, logs the request to a Google Sheet,
 * and answers with JSON.
 *
 * SETUP — one time, about ten minutes
 * -----------------------------------
 * 1. Open the bookings spreadsheet:
 *      https://docs.google.com/spreadsheets/d/1wnsjgERm_9Qd5fx3hZP922pZD6VH9v8Fc_yk6tCaAoE/edit
 * 2. Extensions → Apps Script. Delete the placeholder Code.gs and paste this
 *    whole file in.
 * 3. Edit NOTIFY_EMAIL and BOOKING_SECRET below.
 *    BOOKING_SECRET must be the same value as BOOKING_WEBHOOK_SECRET in the
 *    website environment. Leave both empty to disable the check.
 * 4. Optional: run setupBookingSheet once and authorise. It creates the
 *    "Bookings" (contact form) and "Popup" (homepage Reserve popup) tabs with
 *    their header rows. If you skip this, the tabs and headers are created
 *    automatically on the first booking for each form.
 * 5. Click Deploy → New deployment → select type "Web app".
 *      Description:      Booking form
 *      Execute as:       Me
 *      Who has access:   Anyone
 *    Click Deploy, authorise the script, then copy the Web app URL.
 *    It looks like https://script.google.com/macros/s/AKfy…/exec
 * 6. In the website environment (.env.local locally, and the production
 *    environment) add:
 *      GOOGLE_APPS_SCRIPT_BOOKING_URL=https://script.google.com/macros/s/…/exec
 *      BOOKING_WEBHOOK_SECRET=<the same secret as BOOKING_SECRET below>
 * 7. Redeploy the website. Submit one test booking and confirm the email
 *    arrives, the guest acknowledgement lands in the guest inbox, and the row
 *    appears in the correct tab.
 *
 * AFTER EDITING THIS FILE
 * -----------------------
 * Deploy → Manage deployments → pencil icon → Version: "New version" → Deploy.
 * The /exec URL stays the same; only the code changes.
 *
 * THE SHEET LOG
 * -------------
 * The website has two booking forms with different fields:
 *   • /contact ("Bookings" tab) — name, email, phone, CMS room + rate,
 *     check-in / check-out, guest count, notes.
 *   • homepage "Reserve" popup ("Popup" tab) — name, phone, email and one
 *     travel date. The team confirms the room and meal plan in the reply.
 * Each accepted request is logged to the tab for the form it came from, with
 * headers matching what that form actually collects. Tabs and header rows are
 * created automatically on the first booking — or run setupBookingSheet()
 * once. Set LOG_TO_SHEET to false to stop logging. A sheet failure never
 * blocks a booking — the team email has already been sent at that point, so
 * the request is never lost.
 *
 * NOTES
 * -----
 * • MailApp sends from the Google account that owns the script. Consumers have
 *   a daily quota (about 100 recipients); a Workspace account has more.
 * • The script never exposes the guest's contact details to the browser.
 * • All fields are escaped before being placed into the HTML email.
 * • Booking rows contain personal data. Share the spreadsheet only with people
 *   who need it, and do not publish it.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Where booking enquiries are sent. Comma-separate several addresses. */
var NOTIFY_EMAIL = "jaderiverresort@defoy.in";

/** Shared secret. Must match BOOKING_WEBHOOK_SECRET on the website. */
var BOOKING_SECRET = "";

/** Send the guest a short "we have your request" email? */
var GUEST_ACK = true;

/** Append every request to a Google Sheet? */
var LOG_TO_SHEET = true;

/**
 * Spreadsheet to log into. The project sheet is preset; when the script is
 * bound to the spreadsheet this can stay empty and getActiveSpreadsheet()
 * is used instead.
 */
var SHEET_ID = "1wnsjgERm_9Qd5fx3hZP922pZD6VH9v8Fc_yk6tCaAoE";

/** Tab for the /contact form (email included, CMS room + rate). */
var TAB_CONTACT = "Bookings";

/** Tab for the homepage "Reserve" popup (name, phone, email, travel date). */
var TAB_POPUP = "Popup";

/** Header rows — one per tab. Order must match the rows built in doPost(). */
var HEADERS_CONTACT = [
  "Received",
  "Name",
  "Email",
  "Phone",
  "Room",
  "Rate",
  "Check-in",
  "Check-out",
  "Guests",
  "Page",
  "Notes",
];

var HEADERS_POPUP = [
  "Received",
  "Name",
  "Phone",
  "Email",
  "Travel date",
  "Page",
];

// ---------------------------------------------------------------------------
// Web app handlers
// ---------------------------------------------------------------------------

function doPost(e) {
  try {
    var data = parseBody_(e);
    if (!data) {
      return json_({ ok: false, error: "Could not read the request." });
    }

    if (BOOKING_SECRET && String(data.secret || "") !== BOOKING_SECRET) {
      return json_({ ok: false, error: "Unauthorised." });
    }

    var name = clean_(data.name, 80);
    var email = clean_(data.email, 160);
    var phone = clean_(data.phone, 40);
    var room = clean_(data.room, 96);
    var checkin = clean_(data.checkin, 10);
    var checkout = clean_(data.checkout, 10);
    var guests = clean_(data.guests, 40);
    var notes = clean_(data.notes, 1500);
    var rate = clean_(data.nightlyRate, 40);
    var submittedAt = clean_(data.submittedAt, 40) || new Date().toISOString();
    var source = clean_(data.source, 200);
    var form = clean_(data.form, 16);
    var isPopup = /^popup$/i.test(form) || /popup/i.test(source);

    if (name.length < 2) {
      return json_({ ok: false, error: "Name is required." });
    }
    if (phone.replace(/\D/g, "").length < 8) {
      return json_({ ok: false, error: "A phone number is required." });
    }
    if (!isPopup && !email) {
      return json_({ ok: false, error: "An email address is required." });
    }
    if (!isPopup && room.length < 1) {
      return json_({ ok: false, error: "Choose a room." });
    }

    var received = new Date(submittedAt);
    var receivedLabel = isNaN(received.getTime())
      ? submittedAt
      : Utilities.formatDate(received, "Asia/Kolkata", "d MMM yyyy, HH:mm 'IST'");

    var travelLabel = dateLabel_(checkin);
    var checkinLabel = dateLabel_(checkin);
    var checkoutLabel = dateLabel_(checkout);

    var subject = isPopup
      ? "Booking request — " + name + (travelLabel ? " · " + travelLabel : "")
      : "Booking request — " + name + " · " + room;

    var rows = isPopup
      ? [
          ["Form", "Reserve popup · homepage"],
          ["Received", receivedLabel],
          ["Name", name],
          ["Phone", phone],
          ["Email", email || "—"],
          ["Travel date", travelLabel || "—"],
          ["Page", source || "—"],
        ]
      : [
          ["Form", "Contact form · /contact"],
          ["Received", receivedLabel],
          ["Name", name],
          ["Email", email],
          ["Phone", phone],
          ["Room", rate ? room + " · " + rate + "/night" : room],
          ["Check-in", checkinLabel || "—"],
          ["Check-out", checkoutLabel || "—"],
          ["Guests", guests || "—"],
          ["Page", source || "—"],
        ];

    var plainBody = [
      "JADE RIVER RESORT",
      isPopup ? "New booking request · Reserve popup" : "New booking request · Contact form",
      "",
      formatPlainRows_(rows),
      "",
      notes ? "Notes\n" + notes + "\n" : ""
    ]
      .filter(Boolean)
      .join("\n");

    var options = {
      to: NOTIFY_EMAIL,
      subject: subject,
      body: plainBody,
      htmlBody: emailHtml_(rows, notes, isPopup),
    };
    if (email) options.replyTo = email;

    MailApp.sendEmail(options);

    if (GUEST_ACK && email) {
      try {
        var ackLines = isPopup
          ? [
              "Hello " + name + ",",
              "",
              "Thank you — your booking request has reached the Jade River Resort team.",
              travelLabel ? "Travel date:  " + travelLabel : "",
              "",
              "A person from the resort will reply with availability, the room and the final rate, usually within the hour on working days. If you would like to speak now, call or message +91 95418 98820.",
              "",
              "Jade River Resort",
              "Pahalgam, Jammu & Kashmir",
              "jaderiverresort@defoy.in",
            ]
          : [
              "Hello " + name + ",",
              "",
              "Thank you — your request for the " + room + " has reached the Jade River Resort team.",
              checkinLabel ? "Check-in:  " + checkinLabel : "",
              checkoutLabel ? "Check-out: " + checkoutLabel : "",
              guests ? "Guests:    " + guests : "",
              "",
              "A person from the resort will reply with availability and the final rate, usually within the hour on working days. If you would like to speak now, call or message +91 95418 98820.",
              "",
              "Jade River Resort",
              "Pahalgam, Jammu & Kashmir",
              "jaderiverresort@defoy.in",
            ];

        MailApp.sendEmail({
          to: email,
          subject: "We have your request — Jade River Resort",
          body: ackLines.filter(Boolean).join("\n"),
        });
      } catch (ackError) {
        // The team email already went out; never fail the request for this.
        console.warn("Guest acknowledgement failed: " + ackError);
      }
    }

    var sheetRow = isPopup
      ? [receivedLabel, name, phone, email, checkin, source]
      : [receivedLabel, name, email, phone, room, rate, checkin, checkout, guests, source, notes];
    logToSheet_(sheetRow, isPopup);

    return json_({ ok: true });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: "The resort inbox could not be reached." });
  }
}

function doGet() {
  return ContentService.createTextOutput(
    "Jade River Resort booking endpoint is running. " +
      (LOG_TO_SHEET ? "Sheet log: enabled." : "Sheet log: disabled.")
  ).setMimeType(ContentService.MimeType.TEXT);
}

// ---------------------------------------------------------------------------
// Sheet setup helpers — run these once from the Apps Script editor
// ---------------------------------------------------------------------------

/**
 * Creates both log tabs ("Bookings" for the contact form, "Popup" for the
 * homepage popup) with header rows, and returns the spreadsheet URL.
 * Safe to run repeatedly.
 */
function setupBookingSheet() {
  var spreadsheet = getLogSpreadsheet_();
  if (!spreadsheet) {
    throw new Error(
      "No spreadsheet found. Open this script from the sheet " +
        "(Extensions → Apps Script), or set SHEET_ID below."
    );
  }
  getLogSheet_(spreadsheet, TAB_CONTACT, HEADERS_CONTACT);
  getLogSheet_(spreadsheet, TAB_POPUP, HEADERS_POPUP);
  return "Contact form logs to '" + TAB_CONTACT + "', Reserve popup logs to '" + TAB_POPUP + "': " + spreadsheet.getUrl();
}

/** Appends clearly-marked sample rows to both tabs. */
function testSheetLog() {
  var stamp = "TEST — " + Utilities.formatDate(new Date(), "Asia/Kolkata", "d MMM yyyy, HH:mm 'IST'");
  var contact = logToSheet_(
    [stamp, "Test Guest", "test@example.com", "+91 90000 00000", "Test Room", "₹1,000", "2026-01-01", "2026-01-02", "2", "manual test", "Created by testSheetLog(). Delete this row."],
    false
  );
  var popup = logToSheet_(
    [stamp, "Test Guest", "+91 90000 00000", "test@example.com", "2026-01-01", "manual test"],
    true
  );
  return "Contact form test row: " + (contact ? "added to '" + TAB_CONTACT + "'." : "FAILED — check the execution log")
    + "  Popup test row: " + (popup ? "added to '" + TAB_POPUP + "'." : "FAILED — check the execution log");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return null;
  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    // Some clients send form-encoded data (e.g. `?name=…`).
    if (e.parameter && Object.keys(e.parameter).length) return e.parameter;
    return null;
  }
}

function clean_(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function escape_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** ISO date → "22 Nov 2026". Falls back to the raw value. */
function dateLabel_(value) {
  if (!value) return "";
  var date = new Date(value + "T00:00:00");
  if (isNaN(date.getTime())) return value;
  return Utilities.formatDate(date, "Asia/Kolkata", "d MMM yyyy");
}

/** Aligned plain-text block, e.g. `Name          Shezan`. */
function formatPlainRows_(rows) {
  var width = 0;
  rows.forEach(function (row) {
    if (String(row[0]).length > width) width = String(row[0]).length;
  });
  return rows
    .map(function (row) {
      var label = String(row[0]) + ":";
      while (label.length < width + 2) label += " ";
      return label + "  " + String(row[1] == null ? "—" : row[1]);
    })
    .join("\n");
}

function emailHtml_(rows, notes, isPopup) {
  var table = rows
    .map(function (row) {
      return (
        "<tr>" +
        '<td style="padding:9px 20px 9px 0;border-bottom:1px solid #ece3d7;color:#8a6a4f;font:600 10px/1.5 Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;vertical-align:top;white-space:nowrap">' +
        escape_(row[0]) +
        "</td>" +
        '<td style="padding:9px 0;border-bottom:1px solid #ece3d7;color:#201b17;font:14px/1.6 Arial,sans-serif;vertical-align:top">' +
        escape_(row[1]) +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  var notesBlock = notes
    ? '<p style="margin:22px 0 6px;color:#8a6a4f;font:600 10px/1.5 Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase">Notes</p>' +
      '<p style="margin:0;padding:14px 16px;background:#f5efe6;border-left:3px solid #a87850;color:#201b17;font:14px/1.7 Arial,sans-serif;white-space:pre-wrap">' +
      escape_(notes) +
      "</p>"
    : "";

  return (
    '<div style="margin:0;padding:30px 14px;background:#f5efe6;font-family:Arial,Helvetica,sans-serif">' +
    '<div style="max-width:640px;margin:0 auto;background:#fbf8f3;border:1px solid #e6dbcb;border-radius:10px;overflow:hidden">' +
    '<div style="padding:24px 30px;background:#213329">' +
    '<p style="margin:0;color:#c8d5a5;font:600 10px/1.5 Arial,sans-serif;letter-spacing:.22em;text-transform:uppercase">Jade River Resort</p>' +
    '<h1 style="margin:7px 0 0;color:#fbf8f3;font:600 26px/1.2 Georgia,serif">New booking request</h1>' +
    '<p style="margin:5px 0 0;color:rgba(251,248,243,.68);font:12px/1.5 Arial,sans-serif">' +
    (isPopup ? "Reserve popup · homepage" : "Contact form · /contact") +
    "</p>" +
    "</div>" +
    '<div style="height:3px;background:#a87850"></div>' +
    '<div style="padding:26px 30px 30px">' +
    '<table role="presentation" style="width:100%;border-collapse:collapse;margin:0">' +
    table +
    "</table>" +
    notesBlock +
    "</div>" +
    '<div style="padding:14px 30px;border-top:1px solid #e6dbcb;color:#8a8176;font:11px/1.6 Arial,sans-serif">' +
    "Sent from jaderiverresort.defoy.in · Pahalgam, Jammu &amp; Kashmir" +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

function logToSheet_(row, isPopup) {
  if (!LOG_TO_SHEET) return false;

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockError) {
    console.warn("Sheet log busy, writing without the lock: " + lockError);
    lock = null;
  }

  try {
    var spreadsheet = getLogSpreadsheet_();
    if (!spreadsheet) {
      console.warn("Sheet log skipped: no spreadsheet available.");
      return false;
    }
    var tab = isPopup ? TAB_POPUP : TAB_CONTACT;
    var headers = isPopup ? HEADERS_POPUP : HEADERS_CONTACT;
    var sheet = getLogSheet_(spreadsheet, tab, headers);
    sheet.appendRow(row);
    return true;
  } catch (error) {
    console.warn("Could not log to the sheet: " + error);
    return false;
  } finally {
    if (lock) {
      try {
        lock.releaseLock();
      } catch (releaseError) {
        // Nothing useful to do here.
      }
    }
  }
}

/** The bound spreadsheet when the script is inside a sheet, else SHEET_ID. */
function getLogSpreadsheet_() {
  if (SHEET_ID) {
    try {
      return SpreadsheetApp.openById(SHEET_ID);
    } catch (error) {
      // Fall through to the bound spreadsheet.
    }
  }
  try {
    return SpreadsheetApp.getActiveSpreadsheet() || null;
  } catch (error) {
    return null;
  }
}

/** Finds a tab, creating it with a bold header row when it is missing. */
function getLogSheet_(spreadsheet, tab, headers) {
  var sheet = spreadsheet.getSheetByName(tab);
  if (!sheet) sheet = spreadsheet.insertSheet(tab);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var header = sheet.getRange(1, 1, 1, headers.length);
    header
      .setFontWeight("bold")
      .setBackground("#f0ece4")
      .setVerticalAlignment("middle");
    sheet.setFrozenRows(1);
  }

  return sheet;
}
