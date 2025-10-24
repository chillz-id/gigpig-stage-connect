# SUS – Community & Profile Tabs: User Findings and Requirements

## Scope
Feedback covers: community & profile tab, name display, saving behavior, contact/financial info, profile switcher (comedian/promoter/organisation), dashboard, calendar (gig + availability), navigation, vouchers, and applications.

---

## A. Name Display & Saving

- **Stage name / name display preference not working**
  - Switching preference should change the name shown at the top.
- **Profile information not saving**
  - “Profile information” fields don’t persist after save; revert to defaults on refresh.
- **Contact information**
  - Contact info saving works.
- **Financial information**
  - Ensure financial information is properly secured and encrypted when entered and saved.

---

## B. Profile Switcher & Ownership

- **Mock design uploaded** for how the profile switcher should look.
- Switcher should show **image of the comedian** with their **name under it** and a **dropdown**.
- Dropdown lets the user **switch to their promoter profile** (which has a name as well).
- From the promoter profile, the user can **create an organisation**.
- Each **organisation** has its **own profile** with:
  - Image/logo for the brand  
  - Bank details  
  - Brand name  
  - Brand bio  
  - Brand socials and website  
  - Contact details  
  - Message function similar to a comedian profile  
  - **Own** messages, vouchers, calendars, invoices, etc. (everything is per organisation)
- **Ownership/control**
  - Promoter profile **owns and controls** the organisation profile.

---

## C. Dashboard

- Dashboard loads mostly okay but **struggles when there are no events**.
- **Comedians section works great.**

---

## D. Navigation & Tabs

- **Calendar from sidebar**: opens inside profile (good), but:
  - After entering via sidebar, user is **unable to go back to Profile page** from within the profile (stuck on Calendar).
  - Clicking Profile on the sidebar loads it, but **profile’s own nav bar (Calendar/Invoices/etc.) isn’t clickable** — can only access via sidebar.
- **Invoice and Vouchers**:
  - Should also be present on the **left sidebar**, not only in the profile, because currently they’re **not accessible** from the profile nav.

---

## E. Calendar (Gig & Availability)

- **Load time**: Calendar tab takes **quite a while to load**, then looks great.
- **Gig Calendar**: works; when you add a gig here, it **adds to your gig calendar**.  
  But **not linked to stats** (e.g., “shows performed”).
- **Availability Calendar**:
  - Currently **only weekly**; should also have **monthly** view.
  - **Should connect with Google Calendar** as well.
- **Google/Apple**
  - Make sure **connected Google Calendar works**.
  - Add **Export to Apple Calendar**.
- **Conflict behavior**
  - If a gig is already booked, it **should not block out** the date in Availability, but **should warn of a close conflict**.

---

## F. Session / Sign-out

- User was **randomly signed out** while working (mentioned during Calendar testing).

---

## G. Applications

- **Applications tab** currently **not working**.

---

## H. Vouchers / Vouch System

- **Current 5-star rating** on “give vouch” needs to be **removed**.
- It should be **binary**: **a crown** (vouched) or **no crown**.
  - You **give a vouch** (shows crown) or **take away a vouch**.
- **Search** when giving a vouch:
  - Should bring up a dropdown list of **comedians**, and also **promoters, photographers, videographers, organisations**.
- **Copy/labels**
  - Replace “Use it to vouch for” with **“I vouch for.”**
  - Field label should be **“Profile to vouch for”** (not “User”).
- “You’ve given” list is great — keep it.

---

## I. Stats / Shows Performed

- When adding a gig from the profile, it **does not link to actual stats** (e.g., shows performed).  
  This needs to **count toward stats** when applicable.

---

## J. Miscellaneous Notes

- Calendar **monthly and weekly view is great** (in the gig calendar).  
  Availability calendar currently **only weekly** — needs monthly too.
- Dashboard **shouldn’t break or struggle** when there are no gigs.
- “Applications” tab mentioned as **not working** — confirm or rebuild if needed.

---

## Task Summary (for development)

- [ ] Fix stage name vs name display preference (updates top name, persists).  
- [ ] Make profile information save correctly and persist on refresh.  
- [ ] Keep contact info saving as is (works).  
- [ ] Encrypt and secure financial information on entry and save.  
- [ ] Implement new profile switcher UI (image + name + dropdown).  
- [ ] Allow switching to promoter profile via dropdown.  
- [ ] Allow promoter profile to create organisation profiles.  
- [ ] Ensure each organisation has its own: logo/image, bank details, name, bio, socials, website, contact details, messages, vouchers, calendars, invoices.  
- [ ] Promoter profile must own and control its organisations.  
- [ ] Fix dashboard performance when no events exist.  
- [ ] Make navigation tabs functional (Profile ↔ Calendar ↔ Invoices ↔ Vouchers).  
- [ ] Add Invoices and Vouchers to left sidebar.  
- [ ] Improve Calendar load performance.  
- [ ] Link newly added gigs to stats (“shows performed”).  
- [ ] Add monthly view option to Availability Calendar.  
- [ ] Add Google Calendar connection for Availability Calendar.  
- [ ] Ensure Google Calendar and Apple export functions work correctly.  
- [ ] Show conflict warnings without blocking dates.  
- [ ] Fix random sign-out issue.  
- [ ] Replace 5-star vouch with crown (give/remove vouch).  
- [ ] Update text to “I vouch for” and “Profile to vouch for.”  
- [ ] Vouch search must return comedians, promoters, photographers, videographers, organisations.  
- [ ] Fix “Applications” tab functionality.

---

## Key UI Phrases to Keep (verbatim)

- “It should switch the name up the top based on which preference is chosen.”  
- “Profile information… is not saving… on refresh, it just reverts to default.”  
- “Ensure their financial information is properly secured, encrypted when entered and saved.”  
- “It should have the image of the comedian and then their name under it with a drop down.”  
- “Promoter profile can create an organisation.”  
- “Each organisation will have its own profile… messages and vouchers and stuff like that. And calendars, invoices, everything will be its own per organisation.”  
- “Calendar… takes quite a while to load. And then once it does load, it looks great.”  
- “Availability calendar should have the option to be monthly or weekly… At the moment, it’s only weekly.”  
- “It won’t block out the date, but it will let them know if there’s a close conflict.”  
- “I’ve just been signed out.”  
- “Invoice vouchers should be on the left as well. Not just in the profile.”  
- “It adds it to your… gig calendar… but it won’t be linked to any of the actual stats for… shows performed.”  
- “It just needs to be a crown or no crown.”  
- “Replace ‘Use it to vouch for’ with ‘I vouch for.’”  
- “They should be able to search for comedians, promoters, photographers, and videographers, or organisations.”  
