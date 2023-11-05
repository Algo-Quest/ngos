import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DocumentQueryService {
  public classOne(cls: string) {
    return document.querySelector('.' + cls);
  }

  public classMany(cls: string): NodeList {
    return document.querySelectorAll('.' + cls);
  }

  public idOne(id: string) {
    return document.querySelector('#' + id);
  }
}
