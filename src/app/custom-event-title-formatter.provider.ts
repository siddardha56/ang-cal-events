import { LOCALE_ID, Inject, Injectable } from '@angular/core';
import { CalendarEventTitleFormatter, CalendarEvent } from 'angular-calendar';
import { DatePipe } from '@angular/common';

const Blocked = `<svg xmlns="http://www.w3.org/2000/svg" width="9.905" height="13"><path d="M8.667 4.333h-.619V3.1a3.1 3.1 0 1 0-6.19 0v1.233h-.62A1.242 1.242 0 0 0 0 5.571v6.19A1.242 1.242 0 0 0 1.238 13h7.429A1.242 1.242 0 0 0 9.9 11.762V5.571a1.242 1.242 0 0 0-1.233-1.238zM4.952 9.9A1.238 1.238 0 1 1 6.19 8.667 1.242 1.242 0 0 1 4.952 9.9zm1.919-5.571H3.033V3.1a1.919 1.919 0 0 1 3.838 0z" data-name="Path 2362" fill="#004c91"/></svg>`;


@Injectable()
export class CustomEventTitleFormatter extends CalendarEventTitleFormatter {
  constructor(@Inject(LOCALE_ID) private locale: string) {
    super();
  }

  // you can override any of the methods defined in the parent class

  month(event: any): string {
    return `${event.title}`;
  }

  week(event: any): string {
    if (event.isPTO) return `<div>${event.title}</div>`;
    return (
      `<div class='wo'>
        <div class='wo-event'>
          <b>Store Id:</b> ${event.store_id}
        </div>
        <div class='wo-event'>
          <b>Tracking Id:</b> ${event.id}
        </div>
        <div class="wo-status">${event.optimization_status}</div>
      <div>`
    );
  }

  // day(event: any): string {
  //   return `<div class='wo-event'> <b>Store Id:</b> ${event.store_id}</div> <div class='wo-event'> <b>Tracking Id:</b> ${event.id} </div>`;
  // }
}