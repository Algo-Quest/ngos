import { Subject } from 'rxjs';

export const ngShareCreateOfferOnReceiverClient = new Subject();

export const ngShareOpenAppIfNotBecauseComponentCreateRequired = new Subject();
export const ngShareCreateAnswerSubject = new Subject();
export const nsShareReceivedCallSubject = new Subject();

//for sending call request
export const sendCallReqSubject = new Subject();

export const callerScreenCreatedSubject = new Subject();

export const ngShareOfferResSubject = new Subject();
