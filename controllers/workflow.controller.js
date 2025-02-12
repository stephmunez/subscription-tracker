import dayjs from 'dayjs';
import { createRequire } from 'module';
import { SERVER_URL } from '../config/env.js';
import { workflowClient } from '../config/upstash.js';
import Subscription from '../models/subscription.model.js';
const require = createRequire(import.meta.url);
const { serve } = require('@upstash/workflow/express');

const REMINDERS = [7, 5, 2, 1];
const RENEWAL_PERIODS = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

export const sendReminders = serve(async (context) => {
  const { subscriptionId } = context.requestPayload;
  const subscription = await fetchSubscription(context, subscriptionId);

  if (!subscription || subscription.status !== 'active') return;

  let renewalDate = dayjs(subscription.renewalDate);

  if (renewalDate.isBefore(dayjs())) {
    console.log(
      `Renewal date has passed for subscription ${subscriptionId}. Stopping workflow.`
    );
    return;
  }

  for (const daysBefore of REMINDERS) {
    const reminderDate = renewalDate.subtract(daysBefore, 'day');

    if (reminderDate.isAfter(dayjs())) {
      await sleepUntilReminder(
        context,
        `Reminder ${daysBefore} days before`,
        reminderDate
      );
    }

    await triggerReminder(context, `Reminder ${daysBefore} days before`);
  }

  if (!renewalDate.isSame(dayjs())) {
    console.log(
      `Sleeping until renewal date for subscription ${subscriptionId}`
    );
    await sleepUntilReminder(context, 'Renewal Day', renewalDate);
  }

  const period = RENEWAL_PERIODS[subscription.frequency];
  renewalDate = renewalDate.add(period, 'day');

  await Subscription.findByIdAndUpdate(subscription._id, {
    renewalDate: renewalDate.toISOString(),
  });

  console.log(
    `Renewal date updated for subscription ${subscriptionId} to ${renewalDate.format(
      'YYYY-MM-DD'
    )}`
  );

  await workflowClient.trigger({
    url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
    body: {
      subscriptionId,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    retries: 0,
  });

  console.log(`Workflow re-triggered for subscription ${subscriptionId}`);
});

const fetchSubscription = async (context, subscriptionId) => {
  return await context.run('get subscription', async () => {
    return Subscription.findById(subscriptionId).populate('user', 'name email');
  });
};

const sleepUntilReminder = async (context, label, date) => {
  console.log(`Sleeping until ${label} reminder at ${date}`);
  await context.sleepUntil(label, date.toDate());
};

const triggerReminder = async (context, label) => {
  return await context.run(label, () => {
    console.log(`Triggering ${label} reminder`);
    // Send email, SMS, push notification ...
  });
};
