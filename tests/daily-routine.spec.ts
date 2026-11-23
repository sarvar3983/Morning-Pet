import { expect, test, type Page } from '@playwright/test'

/*
 * End-to-end tests for the Today screen's daily routine.
 * Every test runs on a fake clock (timezone UTC, see playwright.config.ts),
 * so times like 06:50 below are the user's local time.
 */

const at = (iso: string) => new Date(`${iso}Z`)

async function open(page: Page, time: string) {
  await page.clock.install({ time: at(time) })
  await page.goto('/#today')
}

const dailyXp = (page: Page) => page.getByTestId('daily-xp')
const card = (page: Page, title: string) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

/** Fill in tonight's bedtime check-in and (optionally) check in. */
async function planTomorrow(page: Page, wake: string, promises: string[], checkIn = true) {
  const bed = card(page, 'Bedtime check-in')
  await bed.getByLabel("Tomorrow's wake-up time").fill(wake)
  for (const [i, text] of promises.entries()) await bed.getByLabel(`Tomorrow's promise ${i + 1}`).fill(text)
  if (checkIn) await bed.getByRole('button', { name: 'Check in for bed' }).click()
}

/** Run a focus session to completion. */
async function focusSession(page: Page, minutes: 15 | 25 | 45) {
  await card(page, 'Focus').getByRole('button', { name: new RegExp(`^${minutes}`) }).click()
  await page.clock.fastForward(minutes * 60_000 + 2000)
  await page.clock.runFor(1500)
}

test('full day: bedtime plan → on-time wake → promises → focus → bedtime = 100 XP, survives reload', async ({ page }) => {
  // Evening of day 1
  await open(page, '2026-11-24T18:30:00')
  const bed = card(page, 'Bedtime check-in')
  await expect(bed).toContainText('Opens at 7:00 PM')
  await expect(bed.getByRole('button', { name: 'Check in for bed' })).toHaveCount(0)

  await page.clock.fastForward('35:00') // 19:05
  await planTomorrow(page, '07:00', ['Drink water', 'Read 10 pages', 'Call Mom'])
  await expect(dailyXp(page)).toHaveText('10/100')
  // New wake-up time doesn't change today
  await expect(card(page, 'Wake up')).toContainText('No wake-up time set for today')
  await expect(card(page, 'Wake up')).toContainText('From tomorrow: 7:00 AM')
  await page.reload()
  await expect(card(page, 'Bedtime check-in').getByLabel("Tomorrow's promise 3")).toHaveValue('Call Mom')

  // Morning of day 2: plan shows up on Today
  await page.clock.setSystemTime(at('2026-11-25T06:50:00'))
  await page.reload()
  await expect(dailyXp(page)).toHaveText('0/100')
  await expect(card(page, 'Wake up')).toContainText("Today's wake-up time: 7:00 AM")
  const promises = card(page, 'Three promises')
  await expect(promises).toContainText('Planned at bedtime last night')
  await expect(page.getByLabel('Promise 1')).toHaveValue('Drink water')
  await expect(promises).toContainText('lock at 7:15 AM')

  // On-time wake-up: +20, promises lock
  await page.clock.fastForward('15:00') // 07:05
  await page.getByRole('button', { name: "I'm awake" }).click()
  await expect(dailyXp(page)).toHaveText('20/100')
  await expect(card(page, 'Wake up')).toContainText('Up on time')
  await expect(promises).toContainText('Locked at 7:05 AM')
  await expect(page.getByLabel('Promise 1')).toHaveCount(0)

  // Promises: 10 each
  for (const t of ['Drink water', 'Read 10 pages', 'Call Mom']) await promises.getByRole('button', { name: t }).click()
  await expect(dailyXp(page)).toHaveText('50/100')

  // Focus: 15 → 10, 25 → 15, 45 → 20 but capped at 40 total
  await focusSession(page, 15)
  await expect(dailyXp(page)).toHaveText('60/100')
  await focusSession(page, 25)
  await expect(dailyXp(page)).toHaveText('75/100')
  await expect(card(page, 'Focus').getByRole('button', { name: /^45.*\+15 XP/ })).toBeVisible() // only 15 left under the cap
  await focusSession(page, 45)
  await expect(dailyXp(page)).toHaveText('90/100')
  await expect(card(page, 'Focus')).toContainText('40/40 XP')

  // Bedtime closed until 7 PM, then +10 → 100
  await expect(card(page, 'Bedtime check-in')).toContainText('Opens at 7:00 PM')
  await page.clock.setSystemTime(at('2026-11-25T19:30:00'))
  await page.clock.runFor(16_000)
  await card(page, 'Bedtime check-in').getByRole('button', { name: 'Check in for bed' }).click()
  await expect(dailyXp(page)).toHaveText('100/100')

  // An extra focus session can't go over the daily max
  await focusSession(page, 15)
  await expect(dailyXp(page)).toHaveText('100/100')

  await page.reload()
  await expect(dailyXp(page)).toHaveText('100/100')
  await expect(promises.getByRole('button', { name: 'Call Mom', pressed: true })).toBeVisible()
  await expect(card(page, 'Bedtime check-in')).toContainText('Checked in at 7:30 PM')

  await page.getByRole('button', { name: 'My Pet' }).click()
  await expect(page.getByText('⭐ 110')).toBeVisible() // 10 (day 1 bedtime) + 100 (day 2)
})

test('wake-up XP: late or early "I\'m awake" earns no wake XP; promises auto-lock at wake time + 15 min', async ({ page }) => {
  await open(page, '2026-11-24T20:00:00')
  await planTomorrow(page, '07:00', ['Stretch', '', ''])
  await page.clock.setSystemTime(at('2026-11-25T07:10:00'))
  await page.reload()
  await expect(page.getByLabel('Promise 1')).toHaveValue('Stretch')

  await page.clock.fastForward('06:00') // 07:16
  await page.clock.runFor(16_000)
  await expect(card(page, 'Three promises')).toContainText('Locked at 7:15 AM')

  await page.clock.fastForward('25:00') // ~07:41
  await page.getByRole('button', { name: "I'm awake" }).click()
  await expect(card(page, 'Wake up')).toContainText('outside today')
  await expect(dailyXp(page)).toHaveText('0/100')
  // Promises still count, with no penalty for being late
  await card(page, 'Three promises').getByRole('button', { name: 'Stretch' }).click()
  await expect(dailyXp(page)).toHaveText('10/100')

  // Early: far before the window opens (06:00 for a 07:00 wake-up time)
  await page.clock.setSystemTime(at('2026-11-26T05:30:00'))
  await page.reload()
  await expect(card(page, 'Wake up')).toContainText('Tap between 6:00 AM and 7:15 AM')
  await page.getByRole('button', { name: "I'm awake" }).click()
  await page.getByRole('button', { name: "Yes, I'm awake" }).click()
  await expect(dailyXp(page)).toHaveText('0/100')
})

test('no bedtime plan: write promises in the morning before the deadline; wake XP needs no promises', async ({ page }) => {
  await open(page, '2026-11-24T20:00:00')
  await planTomorrow(page, '07:00', [], false) // set wake-up time only, no check-in
  await page.clock.setSystemTime(at('2026-11-25T06:40:00'))
  await page.reload()

  const promises = card(page, 'Three promises')
  await expect(promises).toContainText("You didn't plan promises last night")
  await page.getByLabel('Promise 1').fill('Walk the dog')
  await page.reload()
  await expect(page.getByLabel('Promise 1')).toHaveValue('Walk the dog')

  await page.getByRole('button', { name: "I'm awake" }).click()
  await expect(page.getByRole('alert')).toContainText("You've written 1 of 3")
  await page.getByRole('button', { name: "Yes, I'm awake" }).click()
  await expect(dailyXp(page)).toHaveText('20/100') // full wake reward with only 1 promise
  await expect(promises).toContainText('Locked at 6:40 AM')
})

test('promises cannot be written after the lock deadline; gentle message', async ({ page }) => {
  await open(page, '2026-11-24T20:00:00')
  await planTomorrow(page, '07:00', [], false)
  await page.clock.setSystemTime(at('2026-11-25T09:00:00'))
  await page.reload()
  await expect(card(page, 'Three promises')).toContainText("No promises today, and that's okay")
  await expect(page.getByLabel('Promise 1')).toHaveCount(0)
})

test('wake-up time changed at bedtime only applies from the next day', async ({ page }) => {
  await open(page, '2026-11-24T20:00:00')
  await planTomorrow(page, '07:00', [], false)
  await page.clock.setSystemTime(at('2026-11-25T19:30:00'))
  await page.reload()
  await planTomorrow(page, '08:00', [], false)
  await expect(card(page, 'Wake up')).toContainText("Today's wake-up time: 7:00 AM")
  await expect(card(page, 'Wake up')).toContainText('From tomorrow: 8:00 AM')

  await page.clock.setSystemTime(at('2026-11-26T06:00:00'))
  await page.reload()
  await expect(card(page, 'Wake up')).toContainText("Today's wake-up time: 8:00 AM")
  await expect(card(page, 'Three promises')).toContainText('lock at 8:15 AM')
})

test('no wake-up time set: no wake XP, promises lock only when confirming', async ({ page }) => {
  await open(page, '2026-11-25T10:00:00')
  await expect(card(page, 'Wake up')).toContainText('No wake-up time set for today')
  await expect(card(page, 'Three promises')).toContainText("lock when you confirm you're awake")
  await page.getByLabel('Promise 1').fill('A')
  await page.getByLabel('Promise 2').fill('B')
  await page.getByLabel('Promise 3').fill('C')
  await page.getByRole('button', { name: "I'm awake" }).click()
  await expect(dailyXp(page)).toHaveText('0/100')
  await expect(card(page, 'Three promises')).toContainText('Locked at 10:00 AM')
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

test('missed days are non-punitive: lifetime XP kept, plan carries forward', async ({ page }) => {
  await open(page, '2026-11-24T20:00:00')
  await planTomorrow(page, '07:00', ['Plan A', '', ''])
  await page.clock.setSystemTime(at('2026-11-28T06:30:00')) // skipped 3 days
  await page.reload()
  await expect(dailyXp(page)).toHaveText('0/100')
  await expect(page.getByLabel('Promise 1')).toHaveValue('Plan A')
  await page.getByRole('button', { name: 'My Pet' }).click()
  await expect(page.getByText('⭐ 10')).toBeVisible()
  await expect(page.getByText('📅 1')).toBeVisible()
  await expect(page.getByText(/sick|streak|died/i)).toHaveCount(0)
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

test('old saved data migrates (v1 checklist and v2 routine)', async ({ page }) => {
  await open(page, '2026-11-25T10:00:00')
  await page.evaluate(() =>
    localStorage.setItem(
      'morning-pet:progress',
      JSON.stringify({ version: 1, petName: 'Mochi', totalXp: 140, streak: 2, lastCompletedDate: null, today: { date: '2026-11-23', completedTaskIds: [] } }),
    ),
  )
  await page.goto('/#pet')
  await page.reload()
  await expect(page.getByText('Mochi').first()).toBeVisible()
  await expect(page.getByText('⭐ 140')).toBeVisible()

  await page.evaluate(() =>
    localStorage.setItem(
      'morning-pet:progress',
      JSON.stringify({
        version: 2, petName: 'Pip', wakeTime: '07:00', bankedXp: 55, daysActive: 3, activeFocus: null,
        today: { date: '2026-11-25', alarmTime: '07:00', awakeAt: null, promises: [{ text: 'x', done: false }, { text: '', done: false }, { text: '', done: false }], promisesLockedAt: null, focusSessions: [], bedtimeAt: null },
      }),
    ),
  )
  await page.reload()
  await expect(page.getByText('Pip').first()).toBeVisible()
  await expect(page.getByText('⭐ 55')).toBeVisible()
})
