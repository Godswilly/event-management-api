import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDate implements ValidatorConstraintInterface {
  validate(endDate: Date, args: ValidationArguments): boolean {
    const dto: any = args.object;
    const startDate: Date = dto.startDate;
    return startDate && endDate
      ? new Date(endDate) > new Date(startDate)
      : true;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'endDate must be after startDate';
  }
}
