export interface ClockWheelsProps {
  hour: number;
  minute: number;
  minuteStep: number;
  onChange: (hour: number, minute: number) => void;
}
