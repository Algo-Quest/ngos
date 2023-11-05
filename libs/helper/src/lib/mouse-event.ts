import { Injectable } from '@angular/core';
import { Observable, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MouseEventService {
  public getMouseStateOnContextMenu(): Observable<Document> {
    return fromEvent<Document>(document, 'contextmenu');
  }

  public getMouseStateOnClick(): Observable<Document> {
    return fromEvent<Document>(document, 'click');
  }

  public getMouseStateOnMove(): Observable<Document> {
    return fromEvent<Document>(document, 'mousemove');
  }

  public getMouseStateOnDown(): Observable<Document> {
    return fromEvent<Document>(document, 'mousedown');
  }

  public getMouseStateOnUp(): Observable<Document> {
    return fromEvent<Document>(document, 'mouseup');
  }

  public getMouseStateOnElementDown(elem: Document): Observable<Document> {
    return fromEvent<Document>(elem, 'mousedown');
  }
  public getMouseStateOnElementUp(elem: Document): Observable<Document> {
    return fromEvent<Document>(elem, 'mouseup');
  }
  public getMouseStateOnElementClick(elem: Document): Observable<Document> {
    return fromEvent<Document>(elem, 'click');
  }
}
