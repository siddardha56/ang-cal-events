import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours
} from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz'
import { Subject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarView,
  CalendarEventTitleFormatter,
  CalendarWeekViewBeforeRenderEvent,
  CalendarMonthViewBeforeRenderEvent,
} from 'angular-calendar';

import { CustomEventTitleFormatter } from './custom-event-title-formatter.provider';

const colors: any = {
  red: {
    secondary: '#f9e4e4',
    primary: '#ff0000'
  },
  blue: {
    secondary: '#d9ecf9',
    primary: '#659cc5'
  },
  yellow: {
    secondary: '#fffdc2',
    primary: '#d1cb02'
  },
  green: {
    secondary: '#cafcdf',
    primary: '#1eca6b',
  },
  pink: {
    secondary: '#f9e5f9',
    primary: '#db04c7',
  },
  gray: {
    secondary: '#d4d4d4',
    primary: '#757779',
  }
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: CalendarEventTitleFormatter,
      useClass: CustomEventTitleFormatter
    }
  ],
})
export class AppComponent {
  @ViewChild('modalContent', { static: true }) modalContent: TemplateRef<any>;

  view: CalendarView = CalendarView.Month;

  CalendarView = CalendarView;

  viewDate: Date = new Date();

  selectedFile: File;

  userData = {
    name: '',
    status: {
      D: 0,
      B: 0,
      L: 0,
    },
  }

  modalData: {
    action: string;
    event: any;
  };


  beforeMonthViewRender(renderEvent: CalendarMonthViewBeforeRenderEvent): void {
    renderEvent.body.forEach(day => {
      if (day.date.getDay() === 0 || day.date.getDay() === 6) {
        day.cssClass = 'bg-pink';
      }
    });
  }

  beforeWeekViewRender(renderEvent: CalendarWeekViewBeforeRenderEvent) {
    renderEvent.hourColumns.forEach(hourColumn => {
      hourColumn.hours.forEach(hour => {
        hour.segments.forEach(segment => {
          if (
            segment.date.getDay() === 0 || segment.date.getDay() === 6
          ) {
            segment.cssClass = 'bg-pink';
          }
        });
      });
    });
  }

  actions: CalendarEventAction[] = [
    {
      label: '<fa-icon [icon]="faLock"></fa-icon>',
      a11yLabel: 'Lock',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.events = this.events.filter(iEvent => iEvent !== event);
        this.handleEvent('Deleted', event);
      }
    }
  ];

  refresh: Subject<any> = new Subject();

  events: CalendarEvent[] = [];

  activeDayIsOpen: boolean = true;

  constructor(private modal: NgbModal) { }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date;
    }
  }

  onFileChanged(event) {
    this.selectedFile = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.readAsText(this.selectedFile, "UTF-8");
    fileReader.onload = () => {
      const result = JSON.parse(fileReader.result as string);
      this.userData.name = result.techSchedulerResponses[0].technician_name;

      this.events = [...result.techSchedulerResponses.map(eve => {
        this.userData.status[eve.optimization_status]++;
        return ({
          ...eve,
          isPTO: false,
          start: utcToZonedTime(new Date(eve.start_time), result.techTimezone || ''),
          end: utcToZonedTime(new Date(eve.end_time), result.techTimezone || ''),
          title: `Store Id: ${eve.store_id} \n Tracking Id: ${eve.id}`,
          color: this.getColor(eve.percentile_rank),
          actions: eve.optimization_status === 'L' || eve.optimization_status === 'B' && this.actions,
        });
      }), ...result.technicianPtos.map(eve => ({
        ...eve,
        title: 'Paid Time Off',
        start: utcToZonedTime(new Date(eve.from_date), result.techTimezone || ''),
        end: utcToZonedTime(new Date(eve.to_date), result.techTimezone || ''),
        isPTO: true,
        color: colors.gray
      }))];
      this.refresh.next();
    }
    fileReader.onerror = (error) => {
      console.log(error);
    }
  }

  getColor(percent: Number) {
    if (percent >= 0.8) return colors.red;
    else if (percent >= 0.6) return colors.pink;
    else if (percent >= 0.4) return colors.yellow;
    else if (percent >= 0.0000001) return colors.green;
    else return colors.blue;
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd
  }: CalendarEventTimesChangedEvent): void {
    this.events = this.events.map(iEvent => {
      if (iEvent === event) {
        return {
          ...event,
          start: newStart,
          end: newEnd
        };
      }
      return iEvent;
    });
    this.handleEvent('Dropped or resized', event);
  }

  handleEvent(action: string, event: any): void {
    if (!event.isPTO) {
      this.modalData = { event, action };
      this.modal.open(this.modalContent, { size: 'lg' });
    }
  }

  addEvent(): void {
    this.events = [
      ...this.events,
      {
        title: 'New event',
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
        color: colors.red,
        draggable: true,
        resizable: {
          beforeStart: true,
          afterEnd: true
        }
      }
    ];
  }

  deleteEvent(eventToDelete: CalendarEvent) {
    this.events = this.events.filter(event => event !== eventToDelete);
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }
}
