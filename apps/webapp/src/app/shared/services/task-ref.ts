import { ComponentRef, ViewContainerRef } from '@angular/core';

export const terminalTaskList: {
  winRef: ComponentRef<any> | ViewContainerRef;
  componentId: string | number; //provide -> self generated id
}[] = [];

export const allTaskList: {
  winRef: ComponentRef<any> | ViewContainerRef;
  componentId: string | number; //provide -> self generated id
}[] = [];
