import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsEndTimeAfterStartTime', async: false })
export class IsEndTimeAfterStartTime implements ValidatorConstraintInterface {
  validate(endTime: string, args: ValidationArguments): boolean {
    const dto: any = args.object;
    const startTime: string = dto.startTime;

    if (!startTime || !endTime) return true;

    const start = Date.parse(`1970-01-01T${startTime}`);
    const end = Date.parse(`1970-01-01T${endTime}`);

    return end > start;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'endTime must be after startTime';
  }
}
