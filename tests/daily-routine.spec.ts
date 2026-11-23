import { expect, test, type Page } from '@playwright/test'

/*
 * End-to-end tests for the Today screen's daily routine.
 * Every test runs on a fake clock (timezone UTC, see playwright.config.ts),
 * so times like 06:50 below are the user's local time.
 * A Morning Pet day runs from 4 AM to 4 AM.
 */

const at = (iso: string) => new Date(`${iso}Z`)

/** Open the app at a given time. With `setup`, complete first-day setup with that wake-up time. */
async function open(page: Page, time: string, setup: string | null = '07:00') {
  await page.clock.install({ time: at(time) })
  await page.goto('/#today')
  if (setup) {
    await page.getByLabel('Your wake-up time').fill(setup)
    await page.getByRole('button', { name: 'Start' }).click()
  }
}

async function jumpTo(page: Page, time: string) {
  await page.clock.setSystemTime(at(time))
  await page.reload()
}

const dailyXp = (page: Page) => page.getByTestId('daily-xp')
const card = (page: Page, title: string) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })
const lifetimeXp = async (page: Page) => {
  await page.getByRole('button', { name: 'My Pet' }).click()
  const text = await page.getByText(/^⭐ \d+$/).textContent()
  await page.getByRole('button', { name: 'Today' }).click()
  return Number(text!.replace('⭐ ', ''))
}

/** Fill in tonight's bedtime check-in and (optionally) check in. */
async function planTomorrow(page: Page, wake: string | null, promises: string[], checkIn = true) {
  const bed = card(page, 'Bedtime check-in')
  if (wake) await bed.getByLabel("Tomorrow's wake-up time").fill(wake)
  for (const [i, text] of promises.entries()) await bed.getByLabel(`Tomorrow's promise ${i + 1}`).fill(text)
  if (checkIn) await bed.getByRole('button', { name: 'Check in for bed' }).click()
}

/** Run a focus session to completion. */
async function focusSession(page: Page, minutes: 15 | 25 | 45) {
  await card(page, 'Focus').getByRole('button', { name: new RegExp(`^${minutes}`) }).click()
  await page.clock.fastForward(minutes * 60_000 + 2000)
  await page.clock.runFor(1500)
}

// ───────────────────────── 3. First-day onboarding ─────────────────────────

test('onboarding: choose first wake-up time; wake-up XP starts the next day, no 0/20 on day one', async ({ page }) => {
  await open(page, '2026-11-24T10:00:00', null)
  await expect(page.getByRole('heading', { name: 'Welcome to Morning Pet' })).toBeVisible()
  const start = page.getByRole('button', { name: 'Start' })
  await expect(start).toBeDisabled()

  await page.getByLabel('Your wake-up time').fill('03:30') // before the day starts
  await expect(page.getByRole('alert')).toContainText('Choose a time from 4:00 AM onward')
  await expect(start).toBeDisabled()

  await page.getByLabel('Your wake-up time').fill('07:00')
  await expect(page.getByText('Your first scheduled wake-up is tomorrow at 7:00 AM')).toBeVisible()
  await start.click()

  // Day one: no active wake-up schedule → no confusing 0/20
  const wake = card(page, 'Wake up')
  await expect(wake).toContainText('Starts tomorrow')
  await expect(wake).toContainText('Your first scheduled wake-up is tomorrow at 7:00 AM')
  await expect(page.getByText('0/20')).toHaveCount(0)
  await expect(page.locator('dd', { hasText: '—' })).toContainText('starts tomorrow') // screen-reader text

  // "I'm awake" still locks promises on day one, without wake XP
  await page.getByLabel('Promise 1').fill('Unpack')
  await page.getByRole('button', { name: "I'm awake" }).click()
  await page.getByRole('button', { name: "Yes, I'm awake" }).click()
  await expect(wake).toContainText('Wake-up XP starts with your first scheduled wake-up')
  await card(page, 'Three promises').getByRole('button', { name: 'Unpack' }).click()
  await expect(dailyXp(page)).toHaveText('10/100')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Welcome to Morning Pet' })).toHaveCount(0)

  // Day two: the schedule is active
  await jumpTo(page, '2026-11-25T06:30:00')
  await expect(wake).toContainText("Today's wake-up time: 7:00 AM")
  await expect(wake).toContainText('0/20 XP')
  await expect(wake).toContainText('Tap between 6:45 AM and 7:15 AM')
})

// ───────────────────────── 1. Wake-up window ±15 min ─────────────────────────

for (const [label, time, expected] of [
  ['16 min early → no wake XP', '06:44', '0/100'],
  ['15 min early → wake XP', '06:45', '20/100'],
  ['15 min late → wake XP', '07:15', '20/100'],
  ['15½ min late (same minute) → wake XP', '07:15:30', '20/100'],
  ['16 min late → no wake XP', '07:16', '0/100'],
] as const) {
  test(`wake window: ${label}`, async ({ page }) => {
    await open(page, '2026-11-24T10:00:00')
    await jumpTo(page, `2026-11-25T${time.length === 5 ? `${time}:00` : time}`)
    await page.getByRole('button', { name: "I'm awake" }).click()
    const confirm = page.getByRole('button', { name: "Yes, I'm awake" })
    if (await confirm.isVisible()) await confirm.click()
    await expect(dailyXp(page)).toHaveText(expected)
  })
}

// ───────────────────────── Full day ─────────────────────────

test('full day: bedtime plan → on-time wake → promises → focus → bedtime = 100 XP, survives reload', async ({ page }) => {
  await open(page, '2026-11-24T18:30:00')
  const bed = card(page, 'Bedtime check-in')
  await expect(bed).toContainText('Opens at 7:00 PM')
  await expect(bed.getByRole('button', { name: 'Check in for bed' })).toHaveCount(0)

  await page.clock.fastForward('35:00') // 19:05
  await planTomorrow(page, '07:00', ['Drink water', 'Read 10 pages', 'Call Mom'])
  await expect(dailyXp(page)).toHaveText('10/100')
  await page.reload()
  await expect(card(page, 'Bedtime check-in').getByLabel("Tomorrow's promise 3")).toHaveValue('Call Mom')

  await jumpTo(page, '2026-11-25T06:50:00')
  await expect(dailyXp(page)).toHaveText('0/100')
  const promises = card(page, 'Three promises')
  await expect(promises).toContainText('Planned at bedtime last night')
  await expect(page.getByLabel('Promise 1')).toHaveValue('Drink water')
  await expect(promises).toContainText('lock at 7:15 AM')

  await page.clock.fastForward('15:00') // 07:05
  await page.getByRole('button', { name: "I'm awake" }).click()
  await expect(dailyXp(page)).toHaveText('20/100')
  await expect(promises).toContainText('Locked at 7:05 AM')

  for (const t of ['Drink water', 'Read 10 pages', 'Call Mom']) await promises.getByRole('button', { name: t }).click()
  await expect(dailyXp(page)).toHaveText('50/100')

  await focusSession(page, 15)
  await expect(dailyXp(page)).toHaveText('60/100')
  await focusSession(page, 25)
  await expect(dailyXp(page)).toHaveText('75/100')
  await expect(card(page, 'Focus').getByRole('button', { name: /^45.*\+15 XP/ })).toBeVisible()
  await focusSession(page, 45)
  await expect(dailyXp(page)).toHaveText('90/100')

  await page.clock.setSystemTime(at('2026-11-25T19:30:00'))
  await page.clock.runFor(16_000)
  await card(page, 'Bedtime check-in').getByRole('button', { name: 'Check in for bed' }).click()
  await expect(dailyXp(page)).toHaveText('100/100')
  await focusSession(page, 15)
  await expect(dailyXp(page)).toHaveText('100/100')

  await page.reload()
  await expect(dailyXp(page)).toHaveText('100/100')
  await expect(promises.getByRole('button', { name: 'Call Mom', pressed: true })).toBeVisible()
  expect(await lifetimeXp(page)).toBe(110) // 10 (day 1 bedtime) + 100 (day 2)
})

// ───────────────────────── 2. Plan expiry ─────────────────────────

test('skipped day: the old plan expires without penalty; fresh promises can be written', async ({ page }) => {
  await open(page, '2026-11-24T20:00:00')
  await planTomorrow(page, null, ['Old plan', '', '']) // plan for Nov 25, +10 XP
  await jumpTo(page, '2026-11-26T06:30:00') // Nov 25 skipped entirely
  await expect(dailyXp(page)).toHaveText('0/100')
  const promises = card(page, 'Three promises')
  await expect(promises).toContainText("You didn't plan promises last night")
  await expect(page.getByLabel('Promise 1')).toHaveValue('')
  await page.getByLabel('Promise 1').fill('Fresh start')
  await expect(page.getByLabel('Promise 1')).toHaveValue('Fresh start')
  expect(await lifetimeXp(page)).toBe(10)
  await page.getByRole('button', { name: 'My Pet' }).click()
  await expect(page.getByText(/sick|streak|died/i)).toHaveCount(0)
})

test('plan is used the very next day', async ({ page }) => {
  await open(page, '2026-11-24T21:00:00')
  await planTomorrow(page, null, ['Next day plan', '', ''])
  await jumpTo(page, '2026-11-25T05:00:00')
  await expect(page.getByLabel('Promise 1')).toHaveValue('Next day plan')
})

// ───────────────────────── 4. Bedtime closes at 4 AM ─────────────────────────

test('day boundary at 4 AM: after-midnight check-in, focus and XP belong to the same day', async ({ page }) => {
  await open(page, '2026-11-24T22:00:00')
  // Still Nov 24 after midnight
  await jumpTo(page, '2026-11-25T00:30:00')
  const bed = card(page, 'Bedtime check-in')
  await expect(bed.getByRole('button', { name: 'Check in for bed' })).toBeVisible()
  await planTomorrow(page, '07:30', ['After midnight plan', '', ''])
  await expect(dailyXp(page)).toHaveText('10/100')
  await expect(bed).toContainText('Checked in at 12:30 AM')

  await page.clock.fastForward('30:00') // 01:00
  await focusSession(page, 15) // ends 01:15, still Nov 24
  await expect(dailyXp(page)).toHaveText('20/100')

  await jumpTo(page, '2026-11-25T03:59:00')
  await expect(dailyXp(page)).toHaveText('20/100') // same day
  await expect(bed).toContainText('Checked in at 12:30 AM')

  // 4 AM: new day; previous day's XP banked; plan for the morning ahead appears
  await jumpTo(page, '2026-11-25T04:00:00')
  await expect(dailyXp(page)).toHaveText('0/100')
  await expect(page.getByLabel('Promise 1')).toHaveValue('After midnight plan')
  await expect(card(page, 'Wake up')).toContainText("Today's wake-up time: 7:30 AM")
  await expect(card(page, 'Bedtime check-in')).toContainText('Opens at 7:00 PM')
  expect(await lifetimeXp(page)).toBe(20)
})

test('bedtime check-in is closed from 4 AM until 7 PM', async ({ page }) => {
  await open(page, '2026-11-25T04:30:00')
  await expect(card(page, 'Bedtime check-in')).toContainText('Opens at 7:00 PM')
  await jumpTo(page, '2026-11-25T18:59:00')
  await expect(card(page, 'Bedtime check-in').getByRole('button', { name: 'Check in for bed' })).toHaveCount(0)
  await jumpTo(page, '2026-11-25T19:00:00')
  await expect(card(page, 'Bedtime check-in').getByRole('button', { name: 'Check in for bed' })).toBeVisible()
})

test('wake-up times before 4 AM are rejected at bedtime', async ({ page }) => {
  await open(page, '2026-11-24T20:00:00')
  const bed = card(page, 'Bedtime check-in')
  await bed.getByLabel("Tomorrow's wake-up time").fill('03:00')
  await expect(bed.getByRole('alert')).toContainText('from 4:00 AM')
  await jumpTo(page, '2026-11-25T05:00:00')
  await expect(card(page, 'Wake up')).toContainText("Today's wake-up time: 7:00 AM") // unchanged
})

// ───────────────────────── 5. Mobile layout ─────────────────────────

for (const [name, size] of [
  ['small phone', { width: 375, height: 667 }],
  ['large phone', { width: 412, height: 915 }],
] as const) {
  test(`mobile layout (${name}): tab bar never covers the bedtime button or the last content`, async ({ page, isMobile }) => {
    test.skip(!isMobile, 'bottom tab bar is mobile-only')
    await page.setViewportSize(size)
    await open(page, '2026-11-24T20:00:00')
    const nav = page.getByRole('navigation', { name: 'Main' })
    const navTop = (await nav.boundingBox())!.y

    const button = card(page, 'Bedtime check-in').getByRole('button', { name: 'Check in for bed' })
    await button.scrollIntoViewIfNeeded()
    const box = (await button.boundingBox())!
    expect(box.y + box.height).toBeLessThanOrEqual(navTop)
    await button.click({ trial: true }) // fails if anything intercepts the click

    // Scrolled all the way down, the last line of content sits fully above the tab bar
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const last = page.locator('main > div > :last-child')
    const lastBox = (await last.boundingBox())!
    expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(navTop)

    // Same on My Pet (the reset button is the last thing on the page)
    await page.getByRole('button', { name: 'My Pet' }).click()
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const reset = page.getByRole('button', { name: 'Reset test progress' })
    const resetBox = (await reset.boundingBox())!
    expect(resetBox.y + resetBox.height).toBeLessThanOrEqual(navTop)

    // No horizontal scroll
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

// ───────────────────────── Unchanged behaviour ─────────────────────────

test('no bedtime plan: write promises in the morning before the deadline; wake XP needs no promises', async ({ page }) => {
  await open(page, '2026-11-24T10:00:00')
  await jumpTo(page, '2026-11-25T06:50:00')
  await expect(card(page, 'Three promises')).toContainText("You didn't plan promises last night")
  await page.getByLabel('Promise 1').fill('Walk the dog')
  await page.reload()
  await expect(page.getByLabel('Promise 1')).toHaveValue('Walk the dog')
  await page.getByRole('button', { name: "I'm awake" }).click()
  await expect(page.getByRole('alert')).toContainText("You've written 1 of 3")
  await page.getByRole('button', { name: "Yes, I'm awake" }).click()
  await expect(dailyXp(page)).toHaveText('20/100')
  await expect(card(page, 'Three promises')).toContainText('Locked at 6:50 AM')
})

test('promises lock at wake-up time + 15 min; late "I\'m awake" gets no wake XP; no penalty', async ({ page }) => {
  await open(page, '2026-11-24T20:00:00')
  await planTomorrow(page, null, ['Stretch', '', ''])
  await jumpTo(page, '2026-11-25T07:10:00')
  await page.clock.fastForward('06:00')
  await page.clock.runFor(16_000)
  await expect(card(page, 'Three promises')).toContainText('Locked at 7:15 AM')
  await page.clock.fastForward('25:00')
  await page.getByRole('button', { name: "I'm awake" }).click()
  await expect(card(page, 'Wake up')).toContainText('outside today')
  await expect(dailyXp(page)).toHaveText('0/100')
  await card(page, 'Three promises').getByRole('button', { name: 'Stretch' }).click()
  await expect(dailyXp(page)).toHaveText('10/100')
})

test('after the lock deadline with no promises: gentle message, no inputs', async ({ page }) => {
  await open(page, '2026-11-24T10:00:00')
  await jumpTo(page, '2026-11-25T09:00:00')
  await expect(card(page, 'Three promises')).toContainText("No promises today, and that's okay")
  await expect(page.getByLabel('Promise 1')).toHaveCount(0)
})

test('wake-up time changed at bedtime only applies from the next day', async ({ page }) => {
  await open(page, '2026-11-24T10:00:00')
  await jumpTo(page, '2026-11-25T19:30:00')
  await planTomorrow(page, '08:00', [], false)
  await expect(card(page, 'Wake up')).toContainText("Today's wake-up time: 7:00 AM")
  await expect(card(page, 'Wake up')).toContainText('From tomorrow: 8:00 AM')
  await jumpTo(page, '2026-11-26T06:00:00')
  await expect(card(page, 'Wake up')).toContainText("Today's wake-up time: 8:00 AM")
  await expect(card(page, 'Three promises')).toContainText('lock at 8:15 AM')
})

test('focus timer: counts down, survives reload, pause holds time, stop gives no XP', async ({ page }) => {
  await open(page, '2026-11-25T10:00:00')
  const focus = card(page, 'Focus')
  await focus.getByRole('button', { name: /^25/ }).click()
  await expect(page.getByRole('timer')).toHaveText('25:00')
  await page.clock.runFor(3000)
  await expect(page.getByRole('timer')).toHaveText('24:57')
  await page.clock.fastForward('05:00')
  await page.reload()
  await expect(page.getByRole('timer')).toHaveText(/^19:5\d$/)
  await page.getByRole('button', { name: 'Pause' }).click()
  const paused = await page.getByRole('timer').textContent()
  await page.clock.fastForward('10:00')
  await page.clock.runFor(1000)
  await expect(page.getByRole('timer')).toHaveText(paused!)
  await page.getByRole('button', { name: 'Resume' }).click()
  await page.clock.fastForward('20:00')
  await page.clock.runFor(1500)
  await expect(dailyXp(page)).toHaveText('15/100')
  await focus.getByRole('button', { name: /^15/ }).click()
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(dailyXp(page)).toHaveText('15/100')
})

test('offline: today and tomorrow promises save on the device', async ({ page, context }) => {
  await open(page, '2026-11-25T19:30:00')
  await context.setOffline(true)
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))
  await expect(page.getByText("You're offline. Promises are still saved on this device.").first()).toBeVisible()
  await card(page, 'Three promises').getByLabel('Promise 1').fill('Offline today')
  await card(page, 'Bedtime check-in').getByLabel("Tomorrow's promise 1").fill('Offline tomorrow')
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('morning-pet:progress')!))
  expect(stored.today.promises[0].text).toBe('Offline today')
  expect(stored.nextDay.promises[0]).toBe('Offline tomorrow')
})

test('League shows no Pet XP; League Points and Acorns stay separate', async ({ page }) => {
  await open(page, '2026-11-25T19:30:00')
  await card(page, 'Bedtime check-in').getByRole('button', { name: 'Check in for bed' }).click()
  await page.getByRole('button', { name: 'League' }).click()
  await expect(page.getByText('League Points', { exact: true })).toBeVisible()
  await expect(page.getByText('Acorns', { exact: true })).toBeVisible()
  await expect(page.locator('main')).not.toContainText('10')
})

test('old saved data migrates (v1, v2, v3)', async ({ page }) => {
  await open(page, '2026-11-25T10:00:00', null)
  const load = async (data: object) => {
    await page.evaluate((d) => localStorage.setItem('morning-pet:progress', JSON.stringify(d)), data)
    await page.reload()
  }
  const day = { date: '2026-11-25', alarmTime: '11:00', awakeAt: null, promises: [{ text: 'x', done: false }, { text: '', done: false }, { text: '', done: false }], promisesLockedAt: null, focusSessions: [], bedtimeAt: null }

  // v1 → keeps name + XP, still needs setup (no wake-up time yet)
  await load({ version: 1, petName: 'Mochi', totalXp: 140, streak: 2, lastCompletedDate: null, today: { date: '2026-11-23', completedTaskIds: [] } })
  await expect(page.getByRole('heading', { name: 'Welcome to Morning Pet' })).toBeVisible()
  expect(await lifetimeXp(page)).toBe(140)

  // v2 with a wake-up time → set up already
  await load({ version: 2, petName: 'Pip', wakeTime: '07:00', bankedXp: 55, daysActive: 3, activeFocus: null, today: day })
  await expect(page.getByRole('heading', { name: 'Welcome to Morning Pet' })).toHaveCount(0)
  expect(await lifetimeXp(page)).toBe(55)

  // v3 with a plan
  await load({ version: 3, petName: 'Kiwi', wakeTime: '07:00', nextDay: null, bankedXp: 7, daysActive: 1, activeFocus: null, today: { ...day, promisesPlanned: false } })
  await expect(page.getByLabel('Promise 1')).toHaveValue('x')
  expect(await lifetimeXp(page)).toBe(7)
})
