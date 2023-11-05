import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

declare let CodeMirror: any;

@Component({
  selector: 'ng-monaco-editor',
  templateUrl: './monaco.component.html',
  styleUrls: ['./monaco.component.css'],
  standalone: true,
})
export class MonacoEditorComponent {
  @Input() myData: any;
  @Output() onEditorChange: EventEmitter<string> = new EventEmitter();

  @ViewChild('myTextarea') myTextarea!: ElementRef;

  constructor() {}

  async ngAfterViewInit() {
    await this.loadStylesheet(
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.63.0/codemirror.min.css'
    );
    await this.loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.63.0/codemirror.min.js'
    );
    await this.loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.63.0/mode/javascript/javascript.min.js'
    );

    var myTextarea = this.myTextarea.nativeElement;
    var editor = CodeMirror.fromTextArea(myTextarea, {
      //   mode: 'json',
      lineNumbers: true,
      theme: 'default',
    });

    setTimeout(() => {
      editor.setValue(this.myData.fileData);
    }, 500);
    //width & height
    editor.setSize('100%', this.myData.height || '100vh');

    editor.on('change', () => {
      this.onEditorChange.emit(editor.getValue());
    });
  }

  private loadStylesheet(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = url;

      linkElement.onload = () => {
        resolve();
      };

      linkElement.onerror = () => {
        reject(new Error(`Failed to load stylesheet: ${url}`));
      };

      document.head.appendChild(linkElement);
    });
  }

  private loadScript(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const scriptElement = document.createElement('script');
      scriptElement.src = url;

      scriptElement.onload = () => {
        resolve();
      };

      scriptElement.onerror = () => {
        reject(new Error(`Failed to load stylesheet: ${url}`));
      };

      document.head.appendChild(scriptElement);
    });
  }
}
