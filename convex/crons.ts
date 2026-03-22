import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Fee reminder engine — runs daily at 7:00 AM CAT (05:00 UTC)
// This processes all active schools and sends fee reminders based on each school's arrears policy
// Note: The actual per-school processing is handled by a separate internal mutation
// that must be triggered with each school's ID. A top-level cron action will iterate schools.

export default crons;
