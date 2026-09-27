export class ActivityError extends Error {
  code = "ACTIVITY_ERROR";
}

export class ReminderRateLimitedError extends ActivityError {
  code = "RATE_LIMITED";
  constructor() {
    super("Sudah diingatkan hari ini");
  }
}

export class AlreadyFilledError extends ActivityError {
  code = "ALREADY_FILLED";
  constructor() {
    super("Yaumiyah hari ini sudah terisi");
  }
}
