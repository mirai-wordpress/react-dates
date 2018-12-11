import React from 'react';
import PropTypes from 'prop-types';
import momentPropTypes from 'react-moment-proptypes';
import { forbidExtraProps, mutuallyExclusiveProps, nonNegativeInteger } from 'airbnb-prop-types';
import moment from 'moment';
import values from 'object.values';
import isTouchDevice from 'is-touch-device';

import { DayPickerPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';

import isInclusivelyAfterDay from '../utils/isInclusivelyAfterDay';
import isNextDay from '../utils/isNextDay';
import isSameDay from '../utils/isSameDay';
import isAfterDay from '../utils/isAfterDay';
import isBeforeDay from '../utils/isBeforeDay';

import getVisibleDays from '../utils/getVisibleDays';
import isDayVisible from '../utils/isDayVisible';

import getSelectedDateOffset from '../utils/getSelectedDateOffset';

import toISODateString from '../utils/toISODateString';
import toISOMonthString from '../utils/toISOMonthString';

import DisabledShape from '../shapes/DisabledShape';
import FocusedInputShape from '../shapes/FocusedInputShape';
import ScrollableOrientationShape from '../shapes/ScrollableOrientationShape';
import DayOfWeekShape from '../shapes/DayOfWeekShape';
import CalendarInfoPositionShape from '../shapes/CalendarInfoPositionShape';

import {
  START_DATE,
  END_DATE,
  HORIZONTAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
  DAY_SIZE,
  INFO_POSITION_BOTTOM,
} from '../constants';

import DayPicker from './DayPicker';

const propTypes = forbidExtraProps({
  startDate: momentPropTypes.momentObj,
  endDate: momentPropTypes.momentObj,
  onDatesChange: PropTypes.func,
  startDateOffset: PropTypes.func,
  endDateOffset: PropTypes.func,
  minDate: momentPropTypes.momentObj,
  maxDate: momentPropTypes.momentObj,

  focusedInput: FocusedInputShape,
  onFocusChange: PropTypes.func,
  onClose: PropTypes.func,

  keepOpenOnDateSelect: PropTypes.bool,
  minimumNights: PropTypes.number,
  // Mirai: New prop to set maximum nights selected
  maximumNights: PropTypes.number,
  disabled: DisabledShape,
  isOutsideRange: PropTypes.func,
  isDayBlocked: PropTypes.func,
  isDayHighlighted: PropTypes.func,
  // Mirai: New example to set custom classes for days 
  assignImportantCalendarClass: PropTypes.func,

  // DayPicker props
  renderMonthText: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  enableOutsideDays: PropTypes.bool,
  numberOfMonths: PropTypes.number,
  orientation: ScrollableOrientationShape,
  withPortal: PropTypes.bool,
  initialVisibleMonth: PropTypes.func,
  hideKeyboardShortcutsPanel: PropTypes.bool,
  daySize: nonNegativeInteger,
  noBorder: PropTypes.bool,
  verticalBorderSpacing: nonNegativeInteger,
  horizontalMonthPadding: nonNegativeInteger,

  navPrev: PropTypes.node,
  navNext: PropTypes.node,
  noNavButtons: PropTypes.bool,
  
  minDate: momentPropTypes.momentObj,
  maxDate: momentPropTypes.momentObj,

  onPrevMonthClick: PropTypes.func,
  onNextMonthClick: PropTypes.func,
  onOutsideClick: PropTypes.func,
  renderCalendarDay: PropTypes.func,
  renderDayContents: PropTypes.func,
  renderCalendarInfo: PropTypes.func,
  calendarInfoPosition: CalendarInfoPositionShape,
  firstDayOfWeek: DayOfWeekShape,
  verticalHeight: nonNegativeInteger,
  transitionDuration: nonNegativeInteger,

  // accessibility
  onBlur: PropTypes.func,
  isFocused: PropTypes.bool,
  showKeyboardShortcuts: PropTypes.bool,
  onTab: PropTypes.func,
  onShiftTab: PropTypes.func,

  // i18n
  monthFormat: PropTypes.string,
  weekDayFormat: PropTypes.string,
  phrases: PropTypes.shape(getPhrasePropTypes(DayPickerPhrases)),
  dayAriaLabelFormat: PropTypes.string,

  isRTL: PropTypes.bool,
});

const defaultProps = {
  startDate: undefined, // TODO: use null
  endDate: undefined, // TODO: use null
  minDate: null,
  maxDate: null,
  onDatesChange() {},
  startDateOffset: undefined,
  endDateOffset: undefined,

  focusedInput: null,
  onFocusChange() {},
  onClose() {},

  keepOpenOnDateSelect: false,
  minimumNights: 1,
  // Mirai: New prop to set maximum nights selected
  maximumNights: 0,
  disabled: false,
  isOutsideRange() {},
  isDayBlocked() {},
  isDayHighlighted() {},
  // Mirai: New example to set custom classes for days 
  assignImportantCalendarClass() {},

  // DayPicker props
  renderMonthText: null,
  enableOutsideDays: false,
  numberOfMonths: 1,
  orientation: HORIZONTAL_ORIENTATION,
  withPortal: false,
  hideKeyboardShortcutsPanel: false,
  initialVisibleMonth: null,
  daySize: DAY_SIZE,

  navPrev: null,
  navNext: null,
  noNavButtons: false,

  onPrevMonthClick() {},
  onNextMonthClick() {},
  onOutsideClick() {},

  minDate: undefined,
  maxDate: undefined,

  renderCalendarDay: undefined,
  renderDayContents: null,
  renderCalendarInfo: null,
  renderMonthElement: null,
  calendarInfoPosition: INFO_POSITION_BOTTOM,
  firstDayOfWeek: null,
  verticalHeight: null,
  noBorder: false,
  transitionDuration: undefined,
  verticalBorderSpacing: undefined,
  horizontalMonthPadding: 13,

  // accessibility
  onBlur() {},
  isFocused: false,
  showKeyboardShortcuts: false,
  onTab() {},
  onShiftTab() {},

  // i18n
  monthFormat: 'MMMM YYYY',
  weekDayFormat: 'dd',
  phrases: DayPickerPhrases,
  dayAriaLabelFormat: undefined,

  isRTL: false,
};

const getChooseAvailableDatePhrase = (phrases, focusedInput) => {
  if (focusedInput === START_DATE) {
    return phrases.chooseAvailableStartDate;
  }
  if (focusedInput === END_DATE) {
    return phrases.chooseAvailableEndDate;
  }
  return phrases.chooseAvailableDate;
};

export default class DayPickerRangeController extends React.PureComponent {
  constructor(props) {
    super(props);

    this.isTouchDevice = isTouchDevice();
    this.today = moment();
    this.modifiers = {
      today: day => this.isToday(day),
      blocked: day => this.isBlocked(day),
      'blocked-calendar': day => props.isDayBlocked(day),
      'blocked-out-of-range': day => props.isOutsideRange(day),
      'highlighted-calendar': day => props.isDayHighlighted(day),
      // Mirai: New example to set custom classes for days 
      'important-calendar-class': day => props.assignImportantCalendarClass(day),
      valid: day => !this.isBlocked(day),
      'selected-start': day => this.isStartDate(day),
      'selected-end': day => this.isEndDate(day),
      'blocked-minimum-nights': day => this.doesNotMeetMinimumNights(day),
      'blocked-maximum-nights': day => this.doesNotMeetMaximumNights(day),
      'selected-span': day => this.isInSelectedSpan(day),
      'last-in-range': day => this.isLastInRange(day),
      hovered: day => this.isHovered(day),
      'hovered-span': day => this.isInHoveredSpan(day),
      'hovered-offset': day => this.isInHoveredSpan(day),
      'after-hovered-start': day => this.isDayAfterHoveredStartDate(day),
      'first-day-of-week': day => this.isFirstDayOfWeek(day),
      'last-day-of-week': day => this.isLastDayOfWeek(day),
    };

    const { currentMonth, visibleDays } = this.getStateForNewMonth(props);

    // initialize phrases
    // set the appropriate CalendarDay phrase based on focusedInput
    const chooseAvailableDate = getChooseAvailableDatePhrase(props.phrases, props.focusedInput);

    this.state = {
      hoverDate: null,
      currentMonth,
      phrases: {
        ...props.phrases,
        chooseAvailableDate,
      },
      visibleDays,
      disablePrev: this.shouldDisableMonthNavigation(props.minDate, currentMonth),
      disableNext: this.shouldDisableMonthNavigation(props.maxDate, currentMonth),
    };

    this.onDayClick = this.onDayClick.bind(this);
    this.onDayMouseEnter = this.onDayMouseEnter.bind(this);
    this.onDayMouseLeave = this.onDayMouseLeave.bind(this);
    this.onPrevMonthClick = this.onPrevMonthClick.bind(this);
    this.onNextMonthClick = this.onNextMonthClick.bind(this);
    this.onMonthChange = this.onMonthChange.bind(this);
    this.onYearChange = this.onYearChange.bind(this);
    this.onMultiplyScrollableMonths = this.onMultiplyScrollableMonths.bind(this);
    this.getFirstFocusableDay = this.getFirstFocusableDay.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const {
      startDate,
      endDate,
      focusedInput,
      minimumNights,
      maximumNights,
      isOutsideRange,
      isDayBlocked,
      isDayHighlighted,
      assignImportantCalendarClass,
      phrases,
      initialVisibleMonth,
      numberOfMonths,
      enableOutsideDays,
    } = nextProps;

    const {
      startDate: prevStartDate,
      endDate: prevEndDate,
      focusedInput: prevFocusedInput,
      minimumNights: prevMinimumNights,
      isOutsideRange: prevIsOutsideRange,
      isDayBlocked: prevIsDayBlocked,
      isDayHighlighted: prevIsDayHighlighted,
      phrases: prevPhrases,
      initialVisibleMonth: prevInitialVisibleMonth,
      numberOfMonths: prevNumberOfMonths,
      enableOutsideDays: prevEnableOutsideDays,
    } = this.props;

    let { visibleDays } = this.state;

    let recomputeOutsideRange = false;
    let recomputeDayBlocked = false;
    let recomputeDayHighlighted = false;

    if (isOutsideRange !== prevIsOutsideRange) {
      this.modifiers['blocked-out-of-range'] = day => isOutsideRange(day);
      recomputeOutsideRange = true;
    }

    if (isDayBlocked !== prevIsDayBlocked) {
      this.modifiers['blocked-calendar'] = day => isDayBlocked(day);
      recomputeDayBlocked = true;
    }

    if (isDayHighlighted !== prevIsDayHighlighted) {
      this.modifiers['highlighted-calendar'] = day => isDayHighlighted(day);
      recomputeDayHighlighted = true;
    }
    
    // Mirai: New example to set custom classes for days 
    if (assignImportantCalendarClass !== this.props.assignImportantCalendarClass) {
      this.modifiers['important-calendar-class'] = day => assignImportantCalendarClass(day);
    }

    const recomputePropModifiers = (
      recomputeOutsideRange || recomputeDayBlocked || recomputeDayHighlighted
    );

    const didStartDateChange = startDate !== prevStartDate;
    const didEndDateChange = endDate !== prevEndDate;
    const didFocusChange = focusedInput !== prevFocusedInput;

    if (
      numberOfMonths !== prevNumberOfMonths
      || enableOutsideDays !== prevEnableOutsideDays
      || (
        initialVisibleMonth !== prevInitialVisibleMonth
        && !prevFocusedInput
        && didFocusChange
      )
    ) {
      const newMonthState = this.getStateForNewMonth(nextProps);
      const { currentMonth } = newMonthState;
      ({ visibleDays } = newMonthState);
      this.setState({
        currentMonth,
        visibleDays,
      });
    }

    let modifiers = {};

    if (didStartDateChange) {
      modifiers = this.deleteModifier(modifiers, prevStartDate, 'selected-start');
      modifiers = this.addModifier(modifiers, startDate, 'selected-start');

      if (prevStartDate) {
        const startSpan = prevStartDate.clone().add(1, 'day');
        const endSpan = prevStartDate.clone().add(prevMinimumNights + 1, 'days');
        modifiers = this.deleteModifierFromRange(modifiers, startSpan, endSpan, 'after-hovered-start');
      }
    }

    if (didEndDateChange) {
      modifiers = this.deleteModifier(modifiers, prevEndDate, 'selected-end');
      modifiers = this.addModifier(modifiers, endDate, 'selected-end');
    }

    if (didStartDateChange || didEndDateChange) {
      if (prevStartDate && prevEndDate) {
        modifiers = this.deleteModifierFromRange(
          modifiers,
          prevStartDate,
          prevEndDate.clone().add(1, 'day'),
          'selected-span',
        );
      }

      if (startDate && endDate) {
        modifiers = this.deleteModifierFromRange(
          modifiers,
          startDate,
          endDate.clone().add(1, 'day'),
          'hovered-span',
        );

        modifiers = this.addModifierToRange(
          modifiers,
          startDate.clone().add(1, 'day'),
          endDate,
          'selected-span',
        );
      }
    }

    if (!this.isTouchDevice && didStartDateChange && startDate && !endDate) {
      const startSpan = startDate.clone().add(1, 'day');
      const endSpan = startDate.clone().add(minimumNights + 1, 'days');
      modifiers = this.addModifierToRange(modifiers, startSpan, endSpan, 'after-hovered-start');
    }

    if (prevMinimumNights > 0) {
      if (didFocusChange || didStartDateChange || minimumNights !== prevMinimumNights) {
        const startSpan = prevStartDate || this.today;
        modifiers = this.deleteModifierFromRange(
          modifiers,
          startSpan,
          startSpan.clone().add(prevMinimumNights, 'days'),
          'blocked-minimum-nights',
        );

        modifiers = this.deleteModifierFromRange(
          modifiers,
          startSpan,
          startSpan.clone().add(prevMinimumNights, 'days'),
          'blocked',
        );
      }
    }
    
    if (maximumNights > 0 || maximumNights !== this.props.maximumNights) {
      if (didFocusChange || didStartDateChange) {
        const startSpan = this.props.startDate ? this.props.startDate : this.today;
        let maxDate = this.getMaximumDateFromVisibleDays(visibleDays);
        const numDaysToUnblock = maxDate.clone().startOf("day").diff(startSpan.clone().startOf("day"), 'days') + 1;
        modifiers = this.deleteModifierFromRange(
          modifiers,
          startSpan.clone(),
          startSpan.clone().add(maximumNights + numDaysToUnblock, 'days'),
          'blocked-maximum-nights',
        );
      }
      
      if (didFocusChange || didEndDateChange) {
        const endSpan = this.props.endDate ? this.props.endDate : this.today;
        let minDate = this.getMinimumDateFromVisibleDays(visibleDays);
        const numDaysToUnblock = endSpan.clone().startOf("day").diff(minDate.clone().startOf("day"), "days");
        modifiers = this.deleteModifierFromRange(
          modifiers,
          endSpan.clone().subtract(numDaysToUnblock + maximumNights, 'days'),
          endSpan.clone().subtract(maximumNights, 'days'),
          'blocked-maximum-nights',
        );
      }

      if (startDate && focusedInput === END_DATE) {
        const startSpan = this.props.startDate ? this.props.startDate : this.today;
        let maxDate = this.getMaximumDateFromVisibleDays(visibleDays);
        const numDaysToBlock = maxDate.clone().startOf("day").diff(startSpan.clone().startOf("day"), 'days') + 1;
        modifiers = this.addModifierToRange(
          modifiers,
          startDate.clone().add(maximumNights + 1, 'days'),
          startDate.clone().add(maximumNights + 1 + numDaysToBlock, 'days'),
          'blocked-maximum-nights',
        );
      }
      
      if (endDate && focusedInput === START_DATE) {
          const endSpan = this.props.endDate ? this.props.endDate : this.today;
          let minDate = this.getMinimumDateFromVisibleDays(visibleDays);
          const numDaysToBlock = endSpan.clone().startOf("day").diff(minDate.clone().startOf("day"), "days");
          modifiers = this.addModifierToRange(
            modifiers,
            endSpan.clone().subtract(numDaysToBlock + maximumNights, 'days'),
            endSpan.clone().subtract(maximumNights, 'days'),
            'blocked-maximum-nights',
          );
      }
    }

    if (didFocusChange || recomputePropModifiers) {
      values(visibleDays).forEach((days) => {
        Object.keys(days).forEach((day) => {
          const momentObj = moment(day);
          let isBlocked = false;

          if (didFocusChange || recomputeOutsideRange) {
            if (isOutsideRange(momentObj)) {
              modifiers = this.addModifier(modifiers, momentObj, 'blocked-out-of-range');
              isBlocked = true;
            } else {
              modifiers = this.deleteModifier(modifiers, momentObj, 'blocked-out-of-range');
            }
          }

          if (didFocusChange || recomputeDayBlocked) {
            if (isDayBlocked(momentObj)) {
              modifiers = this.addModifier(modifiers, momentObj, 'blocked-calendar');
              isBlocked = true;
            } else {
              modifiers = this.deleteModifier(modifiers, momentObj, 'blocked-calendar');
            }
          }

          if (isBlocked) {
            modifiers = this.addModifier(modifiers, momentObj, 'blocked');
          } else {
            modifiers = this.deleteModifier(modifiers, momentObj, 'blocked');
          }

          if (didFocusChange || recomputeDayHighlighted) {
            if (isDayHighlighted(momentObj)) {
              modifiers = this.addModifier(modifiers, momentObj, 'highlighted-calendar');
            } else {
              modifiers = this.deleteModifier(modifiers, momentObj, 'highlighted-calendar');
            }
          }

          // Mirai: New example to set custom classes for days 
          const importantCalendarClasses = assignImportantCalendarClass(momentObj);
          modifiers = this.deleteModifier(modifiers, momentObj, /important-calendar-*/);
          if (importantCalendarClasses != null && importantCalendarClasses.length > 0) {
            importantCalendarClasses.forEach(importantCalendarClass => {
              modifiers = this.addModifier(modifiers, momentObj, "important-calendar-" + importantCalendarClass);
            });
          }
        });
      });
    }

    if (minimumNights > 0 && startDate && focusedInput === END_DATE) {
      modifiers = this.addModifierToRange(
        modifiers,
        startDate,
        startDate.clone().add(minimumNights, 'days'),
        'blocked-minimum-nights',
      );

      modifiers = this.addModifierToRange(
        modifiers,
        startDate,
        startDate.clone().add(minimumNights, 'days'),
        'blocked',
      );
    }

    const today = moment();
    if (!isSameDay(this.today, today)) {
      modifiers = this.deleteModifier(modifiers, this.today, 'today');
      modifiers = this.addModifier(modifiers, today, 'today');
      this.today = today;
    }

    if (Object.keys(modifiers).length > 0) {
      this.setState({
        visibleDays: {
          ...visibleDays,
          ...modifiers,
        },
      });
    }

    if (didFocusChange || phrases !== prevPhrases) {
      // set the appropriate CalendarDay phrase based on focusedInput
      const chooseAvailableDate = getChooseAvailableDatePhrase(phrases, focusedInput);

      this.setState({
        phrases: {
          ...phrases,
          chooseAvailableDate,
        },
      });
    }
  }

  onDayClick(day, e) {
    const {
      keepOpenOnDateSelect,
      minimumNights,
      onBlur,
      focusedInput,
      onFocusChange,
      onClose,
      onDatesChange,
      startDateOffset,
      endDateOffset,
      disabled,
    } = this.props;

    if (e) e.preventDefault();
    if (this.isBlocked(day)) return;

    let { startDate, endDate } = this.props;

    if (startDateOffset || endDateOffset) {
      startDate = getSelectedDateOffset(startDateOffset, day);
      endDate = getSelectedDateOffset(endDateOffset, day);

      if (!keepOpenOnDateSelect) {
        onFocusChange(null);
        onClose({ startDate, endDate });
      }
    } else if (focusedInput === START_DATE) {
      const lastAllowedStartDate = endDate && endDate.clone().subtract(minimumNights, 'days');
      const isStartDateAfterEndDate = isBeforeDay(lastAllowedStartDate, day)
        || isAfterDay(startDate, endDate);
      const isEndDateDisabled = disabled === END_DATE;

      if (!isEndDateDisabled || !isStartDateAfterEndDate) {
        startDate = day;
        if (isStartDateAfterEndDate) {
          endDate = null;
        }
      }

      if (isEndDateDisabled && !isStartDateAfterEndDate) {
        onFocusChange(null);
        onClose({ startDate, endDate });
      } else if (!isEndDateDisabled) {
        onFocusChange(END_DATE);
      }
    } else if (focusedInput === END_DATE) {
      const firstAllowedEndDate = startDate && startDate.clone().add(minimumNights, 'days');

      if (!startDate) {
        endDate = day;
        onFocusChange(START_DATE);
      } else if (isInclusivelyAfterDay(day, firstAllowedEndDate)) {
        endDate = day;
        if (!keepOpenOnDateSelect) {
          onFocusChange(null);
          onClose({ startDate, endDate });
        }
      } else if (disabled !== START_DATE) {
        startDate = day;
        endDate = null;
      }
    }

    onDatesChange({ startDate, endDate });
    onBlur();
  }

  onDayMouseEnter(day) {
    /* eslint react/destructuring-assignment: 1 */
    if (this.isTouchDevice) return;
    const {
      startDate,
      endDate,
      focusedInput,
      minimumNights,
      startDateOffset,
      endDateOffset,
    } = this.props;
    const { hoverDate, visibleDays } = this.state;
    let dateOffset = null;

    if (focusedInput) {
      const hasOffset = startDateOffset || endDateOffset;
      let modifiers = {};

      if (hasOffset) {
        const start = getSelectedDateOffset(startDateOffset, day);
        const end = getSelectedDateOffset(endDateOffset, day, rangeDay => rangeDay.add(1, 'day'));

        dateOffset = {
          start,
          end,
        };

        // eslint-disable-next-line react/destructuring-assignment
        if (this.state.dateOffset && this.state.dateOffset.start && this.state.dateOffset.end) {
          modifiers = this.deleteModifierFromRange(modifiers, this.state.dateOffset.start, this.state.dateOffset.end, 'hovered-offset');
        }
        modifiers = this.addModifierToRange(modifiers, start, end, 'hovered-offset');
      }

      if (!hasOffset) {
        modifiers = this.deleteModifier(modifiers, hoverDate, 'hovered');
        modifiers = this.addModifier(modifiers, day, 'hovered');

        if (startDate && !endDate && focusedInput === END_DATE) {
          if (isAfterDay(hoverDate, startDate)) {
            const endSpan = hoverDate.clone().add(1, 'day');
            modifiers = this.deleteModifierFromRange(modifiers, startDate, endSpan, 'hovered-span');
          }

          if (!this.isBlocked(day) && isAfterDay(day, startDate)) {
            const endSpan = day.clone().add(1, 'day');
            modifiers = this.addModifierToRange(modifiers, startDate, endSpan, 'hovered-span');
          }
        }

        if (!startDate && endDate && focusedInput === START_DATE) {
          if (isBeforeDay(hoverDate, endDate)) {
            modifiers = this.deleteModifierFromRange(modifiers, hoverDate, endDate, 'hovered-span');
          }

          if (!this.isBlocked(day) && isBeforeDay(day, endDate)) {
            modifiers = this.addModifierToRange(modifiers, day, endDate, 'hovered-span');
          }
        }

        if (startDate) {
          const startSpan = startDate.clone().add(1, 'day');
          const endSpan = startDate.clone().add(minimumNights + 1, 'days');
          modifiers = this.deleteModifierFromRange(modifiers, startSpan, endSpan, 'after-hovered-start');

          if (isSameDay(day, startDate)) {
            const newStartSpan = startDate.clone().add(1, 'day');
            const newEndSpan = startDate.clone().add(minimumNights + 1, 'days');
            modifiers = this.addModifierToRange(
              modifiers,
              newStartSpan,
              newEndSpan,
              'after-hovered-start',
            );
          }
        }
      }

      this.setState({
        hoverDate: day,
        dateOffset,
        visibleDays: {
          ...visibleDays,
          ...modifiers,
        },
      });
    }
  }

  onDayMouseLeave(day) {
    const { startDate, endDate, minimumNights } = this.props;
    const { hoverDate, visibleDays, dateOffset } = this.state;
    if (this.isTouchDevice || !hoverDate) return;

    let modifiers = {};
    modifiers = this.deleteModifier(modifiers, hoverDate, 'hovered');

    if (dateOffset) {
      modifiers = this.deleteModifierFromRange(modifiers, dateOffset.start, dateOffset.end, 'hovered-offset');
    }

    if (startDate && !endDate && isAfterDay(hoverDate, startDate)) {
      const endSpan = hoverDate.clone().add(1, 'day');
      modifiers = this.deleteModifierFromRange(modifiers, startDate, endSpan, 'hovered-span');
    }

    if (!startDate && endDate && isAfterDay(endDate, hoverDate)) {
      modifiers = this.deleteModifierFromRange(modifiers, hoverDate, endDate, 'hovered-span');
    }

    if (startDate && isSameDay(day, startDate)) {
      const startSpan = startDate.clone().add(1, 'day');
      const endSpan = startDate.clone().add(minimumNights + 1, 'days');
      modifiers = this.deleteModifierFromRange(modifiers, startSpan, endSpan, 'after-hovered-start');
    }

    this.setState({
      hoverDate: null,
      visibleDays: {
        ...visibleDays,
        ...modifiers,
      },
    });
  }

  onPrevMonthClick() {
    const {
      enableOutsideDays,
      maxDate,
      minDate,
      numberOfMonths,
      onPrevMonthClick,
    } = this.props;
    const { currentMonth, visibleDays } = this.state;

    const newVisibleDays = {};
    Object.keys(visibleDays).sort().slice(0, numberOfMonths + 1).forEach((month) => {
      newVisibleDays[month] = visibleDays[month];
    });

    const prevMonth = currentMonth.clone().subtract(2, 'months');
    const prevMonthVisibleDays = getVisibleDays(prevMonth, 1, enableOutsideDays, true);

    const newCurrentMonth = currentMonth.clone().subtract(1, 'month');
    this.setState({
      currentMonth: newCurrentMonth,
      disablePrev: this.shouldDisableMonthNavigation(minDate, newCurrentMonth),
      disableNext: this.shouldDisableMonthNavigation(maxDate, newCurrentMonth),
      visibleDays: {
        ...newVisibleDays,
        ...this.getModifiers(prevMonthVisibleDays),
      },
    }, () => {
      onPrevMonthClick(newCurrentMonth.clone());
    });
  }

  onNextMonthClick() {
    const {
      enableOutsideDays,
      maxDate,
      minDate,
      numberOfMonths,
      onNextMonthClick,
    } = this.props;
    const { currentMonth, visibleDays } = this.state;

    const newVisibleDays = {};
    Object.keys(visibleDays).sort().slice(1).forEach((month) => {
      newVisibleDays[month] = visibleDays[month];
    });

    const nextMonth = currentMonth.clone().add(numberOfMonths + 1, 'month');
    const nextMonthVisibleDays = getVisibleDays(nextMonth, 1, enableOutsideDays, true);
    const newCurrentMonth = currentMonth.clone().add(1, 'month');
    this.setState({
      currentMonth: newCurrentMonth,
      disablePrev: this.shouldDisableMonthNavigation(minDate, newCurrentMonth),
      disableNext: this.shouldDisableMonthNavigation(maxDate, newCurrentMonth),
      visibleDays: {
        ...newVisibleDays,
        ...this.getModifiers(nextMonthVisibleDays),
      },
    }, () => {
      onNextMonthClick(newCurrentMonth.clone());
    });
  }

  onMonthChange(newMonth) {
    const { numberOfMonths, enableOutsideDays, orientation } = this.props;
    const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
    const newVisibleDays = getVisibleDays(
      newMonth,
      numberOfMonths,
      enableOutsideDays,
      withoutTransitionMonths,
    );

    this.setState({
      currentMonth: newMonth.clone(),
      visibleDays: this.getModifiers(newVisibleDays),
    });
  }

  onYearChange(newMonth) {
    const { numberOfMonths, enableOutsideDays, orientation } = this.props;
    const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
    const newVisibleDays = getVisibleDays(
      newMonth,
      numberOfMonths,
      enableOutsideDays,
      withoutTransitionMonths,
    );

    this.setState({
      currentMonth: newMonth.clone(),
      visibleDays: this.getModifiers(newVisibleDays),
    });
  }

  onMultiplyScrollableMonths() {
    const { numberOfMonths, enableOutsideDays } = this.props;
    const { currentMonth, visibleDays } = this.state;

    const numberOfVisibleMonths = Object.keys(visibleDays).length;
    const nextMonth = currentMonth.clone().add(numberOfVisibleMonths, 'month');
    const newVisibleDays = getVisibleDays(nextMonth, numberOfMonths, enableOutsideDays, true);

    this.setState({
      visibleDays: {
        ...visibleDays,
        ...this.getModifiers(newVisibleDays),
      } 
    });
  }

  getFirstFocusableDay(newMonth) {
    const {
      startDate,
      endDate,
      focusedInput,
      minimumNights,
      numberOfMonths,
    } = this.props;

    let focusedDate = newMonth.clone().startOf('month');
    if (focusedInput === START_DATE && startDate) {
      focusedDate = startDate.clone();
    } else if (focusedInput === END_DATE && !endDate && startDate) {
      focusedDate = startDate.clone().add(minimumNights, 'days');
    } else if (focusedInput === END_DATE && endDate) {
      focusedDate = endDate.clone();
    }

    if (this.isBlocked(focusedDate)) {
      const days = [];
      const lastVisibleDay = newMonth.clone().add(numberOfMonths - 1, 'months').endOf('month');
      let currentDay = focusedDate.clone();
      while (!isAfterDay(currentDay, lastVisibleDay)) {
        currentDay = currentDay.clone().add(1, 'day');
        days.push(currentDay);
      }

      const viableDays = days.filter(day => !this.isBlocked(day));

      if (viableDays.length > 0) {
        ([focusedDate] = viableDays);
      }
    }

    return focusedDate;
  }

  getModifiers(visibleDays) {
    const modifiers = {};
    Object.keys(visibleDays).forEach((month) => {
      modifiers[month] = {};
      visibleDays[month].forEach((day) => {
        let modifiersByDay = this.getModifiersForDay(day);
        modifiers[month][toISODateString(day)] = modifiersByDay;
        // Mirai: Add to modifers for a day new custom classes 
        this.addImportantCalendarClasses(modifiers[month][toISODateString(day)], day);
      });
    });

    return modifiers;
  }

  // Mirai: Callback to a function to get custom classes by day 
  getImportantCalendarClasses(day) {
    const modifiers = this.modifiers['important-calendar-class'](day);
    return modifiers ? modifiers : [];
  }
  
  // Mirai : Assign new custom classes to a day
  addImportantCalendarClasses(modifierByDay, day) {
      let importantCalendarClasses = this.getImportantCalendarClasses(day);
      importantCalendarClasses.forEach((clazz) => modifierByDay.add("important-calendar-" + clazz));
  }

  getModifiersForDay(day) {
    return new Set(Object.keys(this.modifiers).filter(modifier => {
      let result = this.modifiers[modifier](day);
      // Mirai: Only filter results that return boolean
      if (typeof(result) === "boolean") {
          return result;
      }
      return false;
    }));
  }

  getStateForNewMonth(nextProps) {
    const {
      initialVisibleMonth,
      numberOfMonths,
      enableOutsideDays,
      orientation,
      startDate,
    } = nextProps;
    const initialVisibleMonthThunk = initialVisibleMonth || (
      startDate ? () => startDate : () => this.today
    );
    const currentMonth = initialVisibleMonthThunk();
    const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
    const visibleDays = this.getModifiers(getVisibleDays(
      currentMonth,
      numberOfMonths,
      enableOutsideDays,
      withoutTransitionMonths,
    ));
    return { currentMonth, visibleDays };
  }

  shouldDisableMonthNavigation(date, visibleMonth) {
    if (!date) return false;

    const {
      numberOfMonths,
      enableOutsideDays,
    } = this.props;

    return isDayVisible(date, visibleMonth, numberOfMonths, enableOutsideDays);
  }

  addModifier(updatedDays, day, modifier) {
    const { numberOfMonths: numberOfVisibleMonths, enableOutsideDays, orientation } = this.props;
    const { currentMonth: firstVisibleMonth, visibleDays } = this.state;

    let currentMonth = firstVisibleMonth;
    let numberOfMonths = numberOfVisibleMonths;
    if (orientation === VERTICAL_SCROLLABLE) {
      numberOfMonths = Object.values(visibleDays).length;
    } else {
      currentMonth = currentMonth.clone().subtract(1, 'month');
      numberOfMonths += 2;
    }
    if (!day || !isDayVisible(day, currentMonth, numberOfMonths, enableOutsideDays)) {
      return updatedDays;
    }

    const iso = toISODateString(day);

    let updatedDaysAfterAddition = { ...updatedDays };
    if (enableOutsideDays) {
      const monthsToUpdate = Object.keys(visibleDays).filter(monthKey => (
        Object.keys(visibleDays[monthKey]).indexOf(iso) > -1
      ));

      updatedDaysAfterAddition = monthsToUpdate.reduce((days, monthIso) => {
        const month = updatedDays[monthIso] || visibleDays[monthIso];
        const modifiers = new Set(month[iso]);
        modifiers.add(modifier);
        return {
          ...days,
          [monthIso]: {
            ...month,
            [iso]: modifiers,
          },
        };
      }, updatedDaysAfterAddition);
    } else {
      const monthIso = toISOMonthString(day);
      const month = updatedDays[monthIso] || visibleDays[monthIso];

      const modifiers = new Set(month[iso]);
      modifiers.add(modifier);
      updatedDaysAfterAddition = {
        ...updatedDaysAfterAddition,
        [monthIso]: {
          ...month,
          [iso]: modifiers,
        },
      };
    }

    return updatedDaysAfterAddition;
  }

  addModifierToRange(updatedDays, start, end, modifier) {
    let days = updatedDays;

    let spanStart = start.clone();
    while (isBeforeDay(spanStart, end)) {
      days = this.addModifier(days, spanStart, modifier);
      spanStart = spanStart.clone().add(1, 'day');
    }

    return days;
  }

  deleteModifier(updatedDays, day, modifier) {
    const { numberOfMonths: numberOfVisibleMonths, enableOutsideDays, orientation } = this.props;
    const { currentMonth: firstVisibleMonth, visibleDays } = this.state;
    let currentMonth = firstVisibleMonth;
    let numberOfMonths = numberOfVisibleMonths;
    if (orientation === VERTICAL_SCROLLABLE) {
      numberOfMonths = Object.values(visibleDays).length;
    } else {
      currentMonth = currentMonth.clone().subtract(1, 'month');
      numberOfMonths += 2;
    }
    if (!day || !isDayVisible(day, currentMonth, numberOfMonths, enableOutsideDays)) {
      return updatedDays;
    }

    const iso = toISODateString(day);

    let updatedDaysAfterDeletion = { ...updatedDays };
    if (enableOutsideDays) {
      const monthsToUpdate = Object.keys(visibleDays).filter(monthKey => (
        Object.keys(visibleDays[monthKey]).indexOf(iso) > -1
      ));

      updatedDaysAfterDeletion = monthsToUpdate.reduce((days, monthIso) => {
        const month = updatedDays[monthIso] || visibleDays[monthIso];
        let modifiers = new Set(month[iso]);
        // Mirai : modifier can be an Regular expression, then it compare with an object  
        if (typeof modifier == "object") {
          modifiers.forEach(currentModifier => {
            if (currentModifier.search(modifier) != -1) {
              modifiers.delete(currentModifier);
            }
          });
        } else {
          modifiers.delete(modifier);
        }
        
        return {
          ...days,
          [monthIso]: {
            ...month,
            [iso]: modifiers,
          },
        };
      }, updatedDaysAfterDeletion);
    } else {
      const monthIso = toISOMonthString(day);
      const month = updatedDays[monthIso] || visibleDays[monthIso];

      let modifiers = new Set(month[iso]);
      // Mirai : modifier can be an Regular expression, then it compare with an object  
      if (typeof modifier == "object") {
        modifiers.forEach(currentModifier => {
          if (currentModifier.search(modifier) != -1) {
            modifiers.delete(currentModifier);
          }
        });
      } else {
        modifiers.delete(modifier);
      }
      updatedDaysAfterDeletion = {
        ...updatedDaysAfterDeletion,
        [monthIso]: {
          ...month,
          [iso]: modifiers,
        },
      };
    }

    return updatedDaysAfterDeletion;
  }

  deleteModifierFromRange(updatedDays, start, end, modifier) {
    let days = updatedDays;

    let spanStart = start.clone();
    while (isBeforeDay(spanStart, end)) {
      days = this.deleteModifier(days, spanStart, modifier);
      spanStart = spanStart.clone().add(1, 'day');
    }

    return days;
  }

  doesNotMeetMinimumNights(day) {
    const {
      startDate,
      isOutsideRange,
      focusedInput,
      minimumNights,
    } = this.props;
    if (focusedInput !== END_DATE) return false;

    if (startDate) {
      const dayDiff = day.diff(startDate.clone().startOf('day').hour(12), 'days');
      return dayDiff < minimumNights && dayDiff >= 0;
    }
    return isOutsideRange(moment(day).subtract(minimumNights, 'days'));
  }

  doesNotMeetMaximumNights(day) {
    const { startDate, endDate, focusedInput, maximumNights } = this.props;
    if (maximumNights <= 0) return false;

    if ((startDate && !focusedInput) || (startDate && focusedInput === END_DATE)) {
      let dayDiff = day.diff(startDate.clone().startOf('day').hour(12), 'days');
      return dayDiff > maximumNights;
    }
    if ((endDate && !focusedInput) || (endDate && focusedInput === START_DATE)) {
      let dayDiff2 = endDate.clone().startOf('day').hour(12).diff(day, 'days');
      return dayDiff2 > maximumNights;
    }
    return false;
  }
  
  getMaximumDateFromVisibleDays(visibleDays) {
    let maxDate = null
    values(visibleDays).forEach((days) => {
      let keysDays = Object.keys(days);
      var currentDate = moment(keysDays[keysDays.length - 1]);
      if (maxDate == null || currentDate.clone().startOf("day").diff(maxDate.clone().startOf("day"), "days") > 0) {
        maxDate = currentDate;
      }
    });
    return maxDate;
  }

  getMinimumDateFromVisibleDays(visibleDays) {
    let minDate = null
    values(visibleDays).forEach((days) => {
      let keysDays = Object.keys(days);
      var currentDate = moment(keysDays[0]);
      if (minDate == null || currentDate.clone().startOf("day").diff(minDate.clone().startOf("day"), "days") < 0) {
        minDate = currentDate;
      }
    });
    return minDate;
  }

  isDayAfterHoveredStartDate(day) {
    const { startDate, endDate, minimumNights } = this.props;
    const { hoverDate } = this.state || {};
    return !!startDate
      && !endDate
      && !this.isBlocked(day)
      && isNextDay(hoverDate, day)
      && minimumNights > 0
      && isSameDay(hoverDate, startDate);
  }

  isEndDate(day) {
    const { endDate } = this.props;
    return isSameDay(day, endDate);
  }

  isHovered(day) {
    const { hoverDate } = this.state || {};
    const { focusedInput } = this.props;
    return !!focusedInput && isSameDay(day, hoverDate);
  }

  isInHoveredSpan(day) {
    const { startDate, endDate } = this.props;
    const { hoverDate } = this.state || {};

    const isForwardRange = !!startDate && !endDate && (
      day.isBetween(startDate, hoverDate) || isSameDay(hoverDate, day)
    );
    const isBackwardRange = !!endDate && !startDate && (
      day.isBetween(hoverDate, endDate) || isSameDay(hoverDate, day)
    );

    const isValidDayHovered = hoverDate && !this.isBlocked(hoverDate);

    return (isForwardRange || isBackwardRange) && isValidDayHovered;
  }
  
  isMonthBlockedByMinDate() {
    const { currentMonth } = this.state;
    const { minDate } = this.props;
      
    if (minDate) {
      return currentMonth.clone().startOf("day").startOf("month").diff(minDate.clone().startOf("day").startOf("month"), "months") <= 0;
    }
    return false;
  }

  isMonthBlockedByMaxDate() {
    const { currentMonth } = this.state;
    const { maxDate, numberOfMonths } = this.props;
        
    if (maxDate) {
      return currentMonth.clone().startOf("day").startOf("month").diff(maxDate.clone().startOf("day").startOf("month"), "months") + numberOfMonths - 1 >= 0;
    }
    return false;
  }

  isInSelectedSpan(day) {
    const { startDate, endDate } = this.props;
    return day.isBetween(startDate, endDate);
  }

  isLastInRange(day) {
    const { endDate } = this.props;
    return this.isInSelectedSpan(day) && isNextDay(day, endDate);
  }

  isStartDate(day) {
    const { startDate } = this.props;
    return isSameDay(day, startDate);
  }

  isBlocked(day) {
    const { isDayBlocked, isOutsideRange } = this.props;
    return isDayBlocked(day) || isOutsideRange(day) || this.doesNotMeetMinimumNights(day) || this.doesNotMeetMaximumNights(day);
  }

  isToday(day) {
    return isSameDay(day, this.today);
  }

  isFirstDayOfWeek(day) {
    const { firstDayOfWeek } = this.props;
    return day.day() === (firstDayOfWeek || moment.localeData().firstDayOfWeek());
  }

  isLastDayOfWeek(day) {
    const { firstDayOfWeek } = this.props;
    return day.day() === ((firstDayOfWeek || moment.localeData().firstDayOfWeek()) + 6) % 7;
  }

  render() {
    const {
      numberOfMonths,
      orientation,
      monthFormat,
      renderMonthText,
      navPrev,
      navNext,
      noNavButtons,
      onOutsideClick,
      withPortal,
      enableOutsideDays,
      firstDayOfWeek,
      hideKeyboardShortcutsPanel,
      daySize,
      focusedInput,
      renderCalendarDay,
      renderDayContents,
      renderCalendarInfo,
      renderMonthElement,
      calendarInfoPosition,
      onBlur,
      onShiftTab,
      onTab,
      isFocused,
      showKeyboardShortcuts,
      isRTL,
      weekDayFormat,
      dayAriaLabelFormat,
      verticalHeight,
      noBorder,
      transitionDuration,
      verticalBorderSpacing,
      horizontalMonthPadding,
    } = this.props;

    const {
      currentMonth,
      phrases,
      visibleDays,
      disablePrev,
      disableNext,
    } = this.state;

    return (
      <DayPicker
        orientation={orientation}
        enableOutsideDays={enableOutsideDays}
        modifiers={visibleDays}
        numberOfMonths={numberOfMonths}
        onDayClick={this.onDayClick}
        onDayMouseEnter={this.onDayMouseEnter}
        onDayMouseLeave={this.onDayMouseLeave}
        onPrevMonthClick={this.onPrevMonthClick}
        onNextMonthClick={this.onNextMonthClick}
        onMonthChange={this.onMonthChange}
        onTab={onTab}
        onShiftTab={onShiftTab}
        onYearChange={this.onYearChange}
        onMultiplyScrollableMonths={this.onMultiplyScrollableMonths}
        monthFormat={monthFormat}
        renderMonthText={renderMonthText}
        withPortal={withPortal}
        hidden={!focusedInput}
        initialVisibleMonth={() => currentMonth}
        daySize={daySize}
        onOutsideClick={onOutsideClick}
        disablePrev={disablePrev}
        disableNext={disableNext}
        navPrev={navPrev}
        navNext={navNext}
        navPrevLocked={this.isMonthBlockedByMinDate()}
        navNextLocked={this.isMonthBlockedByMaxDate()}
        noNavButtons={noNavButtons}
        renderCalendarDay={renderCalendarDay}
        renderDayContents={renderDayContents}
        renderCalendarInfo={renderCalendarInfo}
        renderMonthElement={renderMonthElement}
        calendarInfoPosition={calendarInfoPosition}
        firstDayOfWeek={firstDayOfWeek}
        hideKeyboardShortcutsPanel={hideKeyboardShortcutsPanel}
        isFocused={isFocused}
        getFirstFocusableDay={this.getFirstFocusableDay}
        onBlur={onBlur}
        showKeyboardShortcuts={showKeyboardShortcuts}
        phrases={phrases}
        isRTL={isRTL}
        weekDayFormat={weekDayFormat}
        dayAriaLabelFormat={dayAriaLabelFormat}
        verticalHeight={verticalHeight}
        verticalBorderSpacing={verticalBorderSpacing}
        noBorder={noBorder}
        transitionDuration={transitionDuration}
        horizontalMonthPadding={horizontalMonthPadding}
      />
    );
  }
}

DayPickerRangeController.propTypes = propTypes;
DayPickerRangeController.defaultProps = defaultProps;
