export class TrackTime {
  constructor(
    public readonly hours: number,
    public readonly minutes: number,
    public readonly seconds: number,
  ) {}

  toString(): string {
    const timeParts = [
      String(this.hours).padStart(2, '0'),
      String(this.minutes).padStart(2, '0'),
      String(this.seconds).padStart(2, '0'),
    ];
    return timeParts.join(':');
  }

  /**
   * Formats the time in a human-readable format by removing unnecessary zeros
   * For hours ≥ 1: "h:mm:ss"
   * For minutes ≥ 1 (with 0 hours): "m:ss"
   * For seconds only: "0:ss"
   */
  toReadableString(): string {
    if (this.hours >= 1) {
      return `${this.hours}:${String(this.minutes).padStart(2, '0')}:${String(this.seconds).padStart(2, '0')}`;
    } else if (this.minutes >= 1) {
      return `${this.minutes}:${String(this.seconds).padStart(2, '0')}`;
    } else {
      return `0:${String(this.seconds).padStart(2, '0')}`;
    }
  }

  static fromString(timeString: string): TrackTime {
    const timeFormat = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

    if (!timeFormat.test(timeString)) {
      throw new Error(
        `Invalid time format. Please use HH:MM:SS. Got: ${timeString}`,
      );
    }

    const [hours, minutes, seconds] = timeString.split(':');

    return new TrackTime(
      parseInt(hours, 10),
      parseInt(minutes, 10),
      parseInt(seconds, 10),
    );
  }

  static fromDuration(duration: string): TrackTime | undefined {
    if (!duration) {
      return undefined;
    }

    const regexHours = /(\d+)H/;
    const regexMinutes = /(\d+)M/;
    const regexSeconds = /(\d+)S/;
    const hours = (regexHours.exec(duration) || [])[1] || '0';
    const minutes = (regexMinutes.exec(duration) || [])[1] || '0';
    const seconds = (regexSeconds.exec(duration) || [])[1] || '0';

    return new TrackTime(
      parseInt(hours, 10),
      parseInt(minutes, 10),
      parseInt(seconds, 10),
    );
  }
}
