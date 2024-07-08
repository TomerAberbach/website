---
title: 'The 29 Days per Year Bug (30 Days for Leap Years!)'
tags: ['bugs', 'code', 'docs', 'google']
dates:
  published: 2024-04-23
---

A few years ago my coworker was working on a Google Docs feature when they came
across a _bewildering_ bug.

## The feature 📅

For one component of this feature, users were able to pick any date, save it,
and see it displayed later. This part was implemented and working fine for a
couple weeks.

## The bug report 🐛

Another engineer noticed that a date they had entered as September 1, and which
had previously been displaying correctly, was now being displayed as
_October_ 1. They confirmed that the date was correctly stored in our database
and correctly sent from the server to the client. So my coworker concluded there
was a bug in displaying the date on the client.

## The unit test 🧪

My coworker successfully wrote a
[failing unit test](https://en.wikipedia.org/wiki/Test-driven_development) that
resulted in displaying October 1 for an input date of September 1. They
considered debugging further, but the bug was reported late in the day, so they
decided to log off and debug further the next day.

Little did they know that the next day the unit test would start passing! They
could not reproduce the unit test failure no matter what they did. And to top it
all off, September 1 was now displaying correctly for the bug reporter.

## Eureka! 💡

It was time to get the team together to figure this out. Several of us sat down
and scrutinized the code until the root cause finally dawned on us. We had a
function that converted server provided dates to dates for use in the UI. It
looked something like this:

```js
const toDate = serverDate => {
  const date = new Date()
  date.setFullYear(serverDate.getYear())
  date.setMonth(serverDate.getMonth())
  date.setDate(serverDate.getDay())
  return date
}
```

Do you see the problem?

We realized that the bug was reported on August 31 and disappeared on September
1, the next month. Why does that matter? `new Date()` creates a date object for
the _current_ date and time, and it turns out that calling `setMonth` on the
object does not reset the object's day. It keeps the same day... but only if it
can!
[If the current day of the month is greater than the number of days in the month passed to `setMonth`, then the days will "overflow" into the next month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMonth#description).

That's why September 1 displayed as October 1 on August 31:

```js
const toDate = (
  // September 1, 2021
  serverDate,
) => {
  // August 31, 2021
  const date = new Date()
  // Still August 31, 2021
  date.setFullYear(serverDate.getYear())
  // September 31 -> OVERFLOW! (September has 30 days) -> October 1
  date.setMonth(serverDate.getMonth())
  // Still October 1
  date.setDate(serverDate.getDay())
  return date
}
```

But the following day, September 1, didn't have the same problem because there
was no overflow. The fix was simple:

```js
const toDate = serverDate =>
  new Date(serverDate.getYear(), serverDate.getMonth(), serverDate.getDay())
```

## Why 29 (or 30) days per year? 🤔

So why can this bug only happen 29 (or 30) days per year? Well, the month with
the lowest number of days is February, with 28 days on
[common years](https://en.wikipedia.org/wiki/Common_year). That means displaying
a common year February date maximizes the potential for date overflow; the bug
will occur whenever the _current_ date's day of the month is greater than 28.
But how often does that happen? How many dates have a day of the month greater
than 28?

| Month     | Days                                 | Days of the month > 28             |
| --------- | ------------------------------------ | ---------------------------------- |
| January   | 31                                   | 3                                  |
| February  | 28 (common years) or 29 (leap years) | 0 (common years) or 1 (leap years) |
| March     | 31                                   | 3                                  |
| April     | 30                                   | 2                                  |
| May       | 31                                   | 3                                  |
| June      | 30                                   | 2                                  |
| July      | 31                                   | 3                                  |
| August    | 31                                   | 3                                  |
| September | 30                                   | 2                                  |
| October   | 31                                   | 3                                  |
| November  | 30                                   | 2                                  |
| December  | 31                                   | 3                                  |

Sum up the last column and we have our answer! This bug can happen on only 29
days for common years and 30 days for
[leap years](https://en.wikipedia.org/wiki/Leap_year).

## Lessons learned 🏫

I was thinking about this bug for days (ha!) after solving it and reached a few
conclusions:

- Don't assume a constructor has the same behavior as a sequence of setter calls
  for the same fields! A constructor has access to all the inputs at once while
  each setter only has isolated access to each input. That can force some odd
  behaviors.

- Don't underestimate the complexity of dates and times. If it involves dates
  and times, then test it thoroughly, even if it seems trivial. I guarantee you
  it's not!

- Teamwork makes the dream work 😍
