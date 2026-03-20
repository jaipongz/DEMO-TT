export class OMUtilts {
  private static lastIssuedId = 0

  /**
   * Generates a monotonic timestamp-based id string (millisecond precision).
   * If multiple ids are requested within the same millisecond, it increments by 1
   * to avoid duplicates inside the current process.
   */
  static generateTimestampId(): string {
    const now = Date.now()
    if (now <= OMUtilts.lastIssuedId) {
      OMUtilts.lastIssuedId += 1
    } else {
      OMUtilts.lastIssuedId = now
    }
    return String(OMUtilts.lastIssuedId)
  }
}