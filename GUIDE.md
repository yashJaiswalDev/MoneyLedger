# Money Ledger — Application Guide

*A personal finance ledger built as a single React artifact. Passbook aesthetic, tabbed navigation, data saved on-device only.*

---

## 1. What this application is

Money Ledger tracks four things that most spending apps blur together, and keeps them deliberately separate:

| It tracks | And keeps separate from |
|---|---|
| What you spend | What you invest |
| What you owe | What friends owe you |
| Your income | Money that merely passes through you (settlements, transfers, refunds) |
| A configured interest rate | Any account that needs its own fixed rate |

Nothing leaves the device. There is no backend, no account system, no analytics — the entire application state is one JSON object, held in memory and written to on-device storage after every change.

---

## 2. How data persists

- All state lives in a single object (`data`) covering accounts, cards, spends, savings transactions, EMIs, repayments, recurring payments, budgets, and configuration.
- On every change, that object is serialized and saved automatically, debounced by ~450ms so rapid edits don't thrash storage.
- On open, it loads that saved object, then runs two engines before you see anything:
  - **Interest accrual** — settles any interest owed for every day since you last opened the app.
  - **Recurring payments** — fires any auto-payments whose due date has passed, catching up on multiple missed cycles if you've been away a while (loans, rent, SIPs, subscriptions).
- A **Backup tab** (see §10) is the deliberate escape hatch — since storage is local-only, it can be cleared by the browser or by clearing site data, so the app pushes you toward taking your own copies periodically.

---

## 3. The shell: header, theme, tabs

- **Header** — the wordmark on the left, a light/dark toggle pinned to the far right of that same line, and today's date beneath it.
- **Theme** — one CSS variable switch repaints the entire app: paper tone, ink, rule lines, button contrast, and the ledger's credit/debit colors all adjust so nothing goes muddy in dark mode. Defaults to your system preference on first load, then remembers your choice.
- **Tabs** — eight sections, all reading from and writing to the same shared state: **Overview · Savings · Cards · Friends · Auto-pay · Budget · Backup · Settings**.

---

## 4. The core business rules

These four rules are enforced in the calculation engine, not just the UI — every tab that shows a total obeys them.

**1. Investments are never expenses.**
Any entry categorized as *Investment* (or *Transfer*, *Card Payment*, *Settlement*, *Refund*) is excluded from every expense figure — the monthly spend total, the category breakdown, the budget-usage bars, all of it. It still shows up, just in its own column.

**2. Only "Income" counts as income.**
When money lands in an account, you choose what kind it is: *Income*, *Settlement*, *Transfer*, or *Refund*. Only Income feeds the save-rate calculation. The other three raise your balance without inflating how much you appear to have earned.

**3. Shared bills split automatically.**
If you pay for something in full but someone owes you part of it, you record the whole amount plus their share and their name. The full amount leaves your account or hits your card as normal — but only *your* slice is counted as your spending. Their slice becomes a receivable that sits on the Friends tab until they pay you back, at which point it's logged as a Settlement (see rule 2 — not income).

**4. Interest rate is per-account, not global.**
Every account either follows the single configured RBI-repo-linked rate, or carries its own fixed rate you set directly on that account. Changing the shared rate in Settings never silently changes an account you've deliberately fixed.

---

## 5. Tab-by-tab walkthrough

### Overview
The dashboard. In order: a strip of every account and card as tappable wallet cards (tapping one jumps you to its tab), four headline stats (spent this month, invested, interest earned, save rate), a dynamic **tips** section, a six-month spend-vs-invest bar chart, a category breakdown for the current month, three summary cards (assets, liabilities, next auto-payments), and a recent-entries ledger pulling from every source in the app.

### Savings
Every account rendered as a bank-card face — name, type, interest status, current balance — tappable to filter the statement below to just that account. Below the wallet: an **add account** form (name, type, earning-interest toggle, opening balance, optional own rate), the account list itself with an inline **Interest & rate** editor per account (turn interest on/off, switch between repo-linked and a fixed rate, without affecting any other account), a **move money** form for deposits (with the Income/Settlement/Transfer/Refund choice) and withdrawals, and the filtered account statement.

### Cards
Every credit card rendered as a card face — name, credit limit, current outstanding, a utilization bar — tappable to filter the spends ledger below. Below that: a breakdown of what makes up each card's outstanding balance (your own spends, friends' EMI billed to it, payments you've made against it), a **log a spend** form with a category dropdown and a *shared with someone* toggle for split purchases, a **pay a card bill** form that moves money from an account to reduce the outstanding balance, an **add a card** form, and the filtered spends ledger.

### Friends
Everything involving other people's money running through your accounts. Four stats up top (total owed to you, shared bills pending, friends' EMI remaining, past-due amount), then a **shared bills to collect** panel — every pending split bill with a one-tap settle form (enter what they paid, choose which account it landed in) — followed by settled-in-full history and a log of money received. Below that, the original **friends' EMI tracker**: log a purchase a friend made on your card, watch it bill itself monthly, and log their repayments against it with a progress bar and an overdue flag if your card gets billed faster than they pay you back.

### Auto-pay
Every recurring payment — loans, rent, subscriptions, SIPs — in one list. Each one is mapped to a specific account or card, has a frequency, a next-due date, a category, an optional total-instalment count (so a loan can mark itself finished), and an optional shared amount if part of it (like split rent) belongs to someone else. On every app open, anything overdue fires automatically and lands in the relevant ledger. Pause, resume, or remove any item; nothing here silently disappears.

### Budget
Set a monthly cap per category, or — for *Investment* specifically — a target rather than a cap, since the point there is to hit it, not stay under it. A progress bar per category shows usage against plan, color-shifting from steady to amber to red as you approach or cross the line, with unbudgeted spending called out separately.

### Backup
Its own tab, deliberately separated from Settings. Shows entry count, backup size, and the date you last took a backup (reads "Never" in red until you do). A **Download .json file** button saves a real file to your device — the only copy that survives the app's storage being cleared entirely. Also: copy-as-text, a show/hide toggle so the raw data isn't sitting exposed on screen, and a restore flow that accepts either a chosen file or pasted text, re-running the interest and auto-payment engines afterward so a backup taken weeks ago still catches up correctly.

### Settings
The **interest engine** — the RBI repo rate and your bank's spread over it, the single source for every repo-linked account. Changing it settles all outstanding interest at the old rate first, then applies the new rate going forward. Below that: your monthly income (feeds the save-rate math), category management (add your own; four built-in categories — Investment, Transfer, Card Payment, Settlement, Refund — are permanently excluded from expense and income totals and can't be removed), and a data section for loading a sample month or clearing everything (a two-tap confirmation, with a reminder to back up first).

---

## 6. Two flows worth seeing end-to-end

**Splitting a grocery run with a flatmate:**
Log the spend on the Cards tab → mark it *shared*, enter their portion and name → your expense total only reflects your slice → their portion appears on the Friends tab as a pending shared bill → when they pay you back, you settle it into an account → your balance rises, but it never touches your income or expense figures.

**A friend's EMI purchase falling behind:**
Log their purchase on the Friends tab, mapped to your card and a number of months → each month, the "due count" ticks forward whether or not they've paid → their repayments are logged separately and offset the amount they owe → if the billed amount outpaces what they've repaid, the overdue figure turns visible and a tip surfaces on Overview flagging it.

---

## 7. The underlying data model

```
config     → repo rate, spread, monthly income, categories, theme, last backup time
accounts[] → savings/cash accounts: balance, interest on/off, rate mode, own rate
cards[]    → credit cards: name, limit
spends[]   → card ledger: date, card, amount, category, note, shared-amount, shared-friend
savingsTx[]→ everything touching an account: deposits, withdrawals, interest, auto-debits,
             card payments, settlements — each typed and categorized
emis[]     → friends' purchases on your card: principal, months, start date
repayments[]→ money received against a specific EMI
recurring[]→ scheduled loans/rent/subscriptions: amount, frequency, next due, source,
             category, total/paid instalments, optional shared portion
budgets{}  → category → monthly cap (or target, for Investment)
```

Every number shown anywhere in the app is derived fresh from these seven structures — there's no separately cached "total" that could drift out of sync with the underlying entries.

---

## 8. What's deliberately not in it

- No card numbers, even partial ones — a nickname identifies a card instead, since storing that in plaintext local storage isn't something worth the risk for a personal tracker.
- No bank logos — avoids bundling trademarked assets; cards are told apart by name and an auto-assigned ink color instead.
- No server, no accounts, no sync between devices — the Backup tab's file export is the intended way to move data between your own devices.
