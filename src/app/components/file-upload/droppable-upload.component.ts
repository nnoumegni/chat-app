import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WINDOW } from '../../services/global-scope.service';
import { AuthFormService } from '../auth-form/auth-form.service';
import Swal from 'sweetalert2';
import { Subject, Subscription } from 'rxjs';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { UtilsService } from '../../services/utils.service';
import {AppDataStoreService} from '@common/services/app-data-store.service';
import {DataRestService} from '@common/services/data-rest.service';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-droppable-upload',
  styleUrls: ['./droppable-upload.component.scss'],
  templateUrl: './droppable-upload.component.html'
})
export class DroppableUploadComponent implements OnInit, OnDestroy {
  @Input() isCustomForm;
  @Input() addMediaClickHandler = new Subject<any>();
  @Input() maxLength = 10;
  @Input() fileTypes = ['audio/mpeg', 'video/mp4'];
  @Input() isMansonryView = false;
  @Input() extraData: any = {};
  @Input() saveAsFile = false;
  @Input() headerTitle = 'Upload files';
  @Input() headerSubTitle = 'Accessible anywhere, anytime!';

  @Output() startAction = new EventEmitter<any>();
  @Output() doneAction = new EventEmitter<any>();
  @Output() deleteMediaAction = new EventEmitter<any>();
  @Output() progressAction: EventEmitter<any> = new EventEmitter();

  progress = 0;
  done = false;
  formats = {
    mp3: 'audio/mpeg',
    mp4: 'video/mp4'
  };

  showCustomFileInput = true;
  playlistUri = '';

  form: FormGroup;
  loading = false;
  selectedFile;

  @ViewChild('fileInput') fileInput: ElementRef;

  message: any;
  title: any;
  showUploadForm: boolean;
  placeholders: any = {};
  fileInfo: any = {};
  formValues: any = {};
  progressInfo: any = {};
  uploadedFiles = [];
  subs: Subscription = new Subscription();
  resetForm: boolean;
  @Input() apiHandlerData: any;

  constructor(
    @Inject(WINDOW) private window: any,
    private fb: FormBuilder,
    private dataRestService: DataRestService,
    private cd: ChangeDetectorRef,
    private authFormService: AuthFormService,
    private appDataStoreService: AppDataStoreService
  ) {}

  get files(): FormArray {
    return this.form.get('files') as FormArray;
  }

  get ctrls() {
    return this.form.controls;
  }

  get fileInfoKeys() {
    return Object.keys(this.fileInfo);
  }

  ngOnInit(): void {
    this.appDataStoreService.showUploadModal.subscribe(((show) => {
      this.showUploadForm = show;
    }) as any);

    this.subs.add(this.addMediaClickHandler.subscribe(() => {
      this.fileInput.nativeElement.click();
    }, () => {}));

    this.createForm();
  }

  createForm() {
    this.form = this.form || this.fb.group({
      files: this.fb.array([], (ctrl) => {
        return ctrl.value.length > 0 ? null : { required: true };
      }),
      // name: [""],
      mid: [this.authFormService.memberID, Validators.required],
      playlistUri: [this.playlistUri]
    });
  }

  getFileInputItem({
   name = '',
   caption = '',
   file = null,
   resized = null,
   blob = null,
   localUrl = null,
   mimeType = '',
   size = 0,
   isValid = true
  }): FormGroup {
    const fileValue = blob ? blob : file;
    return this.fb.group({
      ...{
        file: [fileValue, Validators.required],
        mid: [this.authFormService.memberID, Validators.required],
        name: [name, Validators.required],
        caption: [caption],
        resized: [resized],
        size: [size],
        localUrl: [localUrl],
        mimeType: [mimeType],
        playlistUri: [this.playlistUri],
        isValid: [isValid]
      },
      ...this.apiHandlerData
    });
  }

  addFileInputItem({ name, file, resized = null, blob = null, localUrl = null, mimeType = '', size = 0 }): void {
    const isValid = this.isSupportedFileType(mimeType);
    const items = this.form.get('files') as FormArray;
    items.push(this.getFileInputItem({ name, file, resized, blob: null, localUrl, mimeType, size, isValid }));
    Object.keys(items.value).forEach((key, idx) => {
      this.placeholders[idx] = items.value[key].name;
    });

    this.updateFormValues();
  }

  getFileInfo(i: number) {
    const items = this.ctrls.files as FormArray;
    const { file, resized, name, localUrl, mimeType } = items.value[i];
    const faCls = this.isVideo(mimeType) ? 'fa-file-video-o' : (this.isAudio(mimeType) ? 'fa-file-audio-o' : 'fa-file-o');
    const extension = name.split('.').pop();
    const title = UtilsService.fileNameToTitle(name);
    const isValid = this.isSupportedFileType(mimeType);
    return { faCls, extension, mimeType, title, isValid };
  }

  isVideo(mimeType: string) {
    return /video/gi.test(mimeType);
  }

  isAudio(mimeType: string) {
    return /audio/gi.test(mimeType);
  }

  private updateFormValues() {
    // Keep newly added files only
    const items = this.ctrls.files as FormArray;
    if (this.maxLength > 0 && items.length > this.maxLength) {
      for (let i = 0; i < (items.length - this.maxLength); i++) {
        items.removeAt(0);
      }
    }

    // items = this.ctrls.files as FormArray;
    this.formValues = {...this.formValues, ...{files: items.value}};
    this.fileInfo = {};
    Object.keys(items.value).forEach((key, idx) => {
      this.placeholders[idx] = items.value[key].name;
      this.fileInfo[idx] = this.getFileInfo(idx);
    });
  }

  onFileChange(event, callback?) {
    this.showCustomFileInput = false;
    setTimeout(() => {
      this.showCustomFileInput = true;
    });

    Object.keys(event.target.files).forEach((key) => {
      const file = event.target.files[key];
      const appendFile = (res: any = {}) => {
        if (file.size > 0) {
          const {name} = file;
          this.addFileInputItem({name, file, resized: res.url, blob: res.blob, mimeType: file.type, size: file.size});

          if (typeof callback === 'function') {
            callback();
          }
        } else {
          Swal.fire('Oops error!', 'File is empty').then();
        }
      };

      if (this.isImage(file.type)) {
        UtilsService.imageSizeOptimizer(file).then((res: any) => {
          UtilsService.optimizeImageFromUrl({url: res.url, type: file.type}).then((data) => {
            appendFile(data);
          });
        });
      } else {
        appendFile();
      }
    });
  }

  isSupportedFileType(mimeType) {
    let isSupported = false;
    this.fileTypes.forEach((type) => {
      if (/image/gi.test(type) && /image/gi.test(mimeType)) { isSupported = true; }
      if (/text/gi.test(type) && /csv/gi.test(mimeType)) { isSupported = true; }
      if ((/audio/gi.test(type) || /video/gi.test(type)) && (/audio/gi.test(mimeType) || /video/gi.test(mimeType))) { isSupported = true; }
      if (this.isZipFile(mimeType)) { isSupported = true; }
    });

    return isSupported || this.fileTypes.includes('*');
  }

  isZipFile(mimeType: string) {
    return /application/gi.test(mimeType) && /zip/gi.test(mimeType);
  }

  private toFormData<T>( formValue: T ) {
    const formData = new FormData();

    for ( const key of Object.keys(formValue) ) {
      const value = formValue[key];
      formData.append(key, value);
    }

    return formData;
  }

  onSubmit(e?) {
    const that = this;
    const items = this.form.get('files') as FormArray;
    const keys = Object.keys(items.value);

    // this is preventing forms to be updated with attachment
    // if (!(keys && keys.length)) { return; }

    if (e) {
      e.preventDefault();
    }

    this.startAction.emit({});

    (async function processFile() {
      const key = keys.shift();
      if (!key) {
        that.done = true;
        that.loading = false;
        const initFileCount = (that.form.get('files') as FormArray).length;
        const uploadedFileCount = (that.uploadedFiles || []).length;

        let res = that.uploadedFiles;

        if (that.maxLength === 1) {
          res = [that.uploadedFiles[that.fileInfoKeys.length - 1]];
        }

        that.doneAction.emit(res);
        // that.doneAction.emit({uploadedFiles: that.uploadedFiles, initFileCount, uploadedFileCount});

        // reset the custom form after the upload is completed
        if (that.isCustomForm && that.maxLength === 1) {
          that.clearFile();
        }

        return;
      }

      const rawData = {...items.value[key], ...that.extraData};
      const data = that.toFormData(rawData);
      const {resized, name, file, mimeType} = items.value[key] || {} as any;

      if (resized && that.isImage(mimeType)) {
        that.uploadedFiles.unshift({name, thumb: resized});
        return processFile();
      }

      that.loading = true;
      const prog$: any = that.dataRestService.doUpload(data);
      that.subs.add(prog$.subscribe((event: any) => {
        if (event && event.type === HttpEventType.UploadProgress) {
            // This is an upload progress event. Compute and show the % done:
          that.progressInfo[key] = Math.round(
              (100 * event.loaded) / event.total
          );
          that.progressAction.emit(that.progressInfo);
        } else if (event instanceof HttpResponse) {
          const resp = event.body;

          if (resp.url || resp.file || resp.success) {
            that.uploadedFiles.push(resp);
          }

          processFile();
        }
      }, (err) => {
        processFile();
      }
      ));
    })();
  }

  onCustomSubmit(e) {
    this.onFileChange(e, () => {
      this.onSubmit(e);
    });
  }

  clearFile() {
    // this.form.get('name').setValue(null);
    // this.form.get('file').setValue(null);
    // this.fileInput.nativeElement.value = '';
    const items = this.form.get('files') as FormArray;
    while (items.length) {
      items.removeAt(0);
    }

    this.ctrls.files.reset();
    this.fileInfo = {};

    this.uploadedFiles = [];
    this.resetForm = true;
    this.progressInfo = {};
    setTimeout(() => {
      this.resetForm = false;
      this.updateFormValues();
    });
  }

  closeUploadModal() {
    this.showUploadForm = false;
  }

  ngOnDestroy(): void {
    this.clearFile();
    this.subs.unsubscribe();
  }

  formatFileSize(bytes) {
    return UtilsService.formatFileSize(bytes);
  }

  isImage(mimeType: string) {
    return /image/gi.test(mimeType) && this.saveAsFile !== true;
  }

  onFileDropped(evt: any) {
    this.onFileChange({
      target: evt.dataTransfer
    });
  }
}
