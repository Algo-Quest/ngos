import {
  Component,
  ComponentRef,
  Input,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplyMoveDirective } from '../../shared/directives/apply-move.directive';
import { allTaskList } from '../../shared/services/task-ref';
import { ngShareService } from '../../shared/services/ngShareCallReceive';
import { ClientService } from '../../shared/services/client';
import {
  ngShareOpenAppIfNotBecauseComponentCreateRequired,
  nsShareReceivedCallSubject,
} from '../../shared/subject/ngShareCreateAnswer';
import { take } from 'rxjs';

@Component({
  selector: 'ngos-receiver-screen',
  standalone: true,
  imports: [CommonModule, ApplyMoveDirective],
  templateUrl: './receiver-screen.component.html',
  styleUrls: ['./receiver-screen.component.css'],
})
export class ReceiverScreenComponent {
  @Input() myComponentId!: string;

  constructor(private _clientService: ClientService) {
    nsShareReceivedCallSubject.pipe(take(1)).subscribe((res) => {
      //works well to hide the receiver screen as we close this app
      this.denyReq();
    });
  }

  public receiveReq() {
    const myComponentId = this.myComponentId;
    //
    let offerFromClient = ngShareService.find(
      (service: any) => service.message.uid == this._clientService.clientId
    );

    //emit so, that it can be used received in another component so, that in that component the createAnswer could be called
    ngShareOpenAppIfNotBecauseComponentCreateRequired.next(offerFromClient);
  }

  public denyReq() {
    let requiredCompIndex = +allTaskList.findIndex(
      (comp) => comp.componentId == this.myComponentId
    ) as number;

    let reqComp = allTaskList[requiredCompIndex] as {
      winRef: ComponentRef<HTMLElement>;
      componentId: string;
    };

    //delete from array of ref once closed
    allTaskList.splice(requiredCompIndex, 1);

    reqComp?.winRef.destroy();
  }
}
