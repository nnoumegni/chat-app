import { Inject, Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WINDOW } from '../../services/global-scope.service';
import { AuthFormService } from '../auth-form/auth-form.service';
import Swal from 'sweetalert2';
import { BehaviorSubject,  Subscription } from 'rxjs';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { UtilsService } from '../../services/utils.service';
import {DataRestService} from '@common/services/data-rest.service';

@Injectable({
  providedIn: 'root'
})
export class DroppableUploadService {
  progress = 0;
  done = false;
  formats = {
    mp3: 'audio/mpeg',
    mp4: 'video/mp4'
  };

  fileTypes = ['audio/mpeg', 'video/mp4'];

  headerTitle = 'Media upload form';
  showCustomFileInput = true;
  playlistUri = '';

  form: FormGroup;
  loading = false;
  selectedFile;

  message: any;
  title: any;
  showUploadForm: boolean;
  placeholders: any = {};
  fileInfo: any = {};
  maxLength = 10;
  formValues: any = {};
  progressInfo: any = {};
  uploadedFiles = [];
  subs: Subscription = new Subscription();
  resetForm: boolean;
  playlistName = '';
  progressObs$ = new BehaviorSubject<any>(null);

  constructor(
    @Inject(WINDOW) private window: any,
    private fb: FormBuilder,
    private dataRestService: DataRestService,
    private authFormService: AuthFormService,
  ) {}

  init(playlistName = '') {
    this.playlistName = playlistName;
    this.createForm();
  }

  get uploadData() {
    const org = this.window.ORG_CONFIG.org;
    return {
      action: 'addDocument',
      data: JSON.stringify({org, mid: this.authFormService.memberID}),
      path: 'association'
    };
  }

  get files(): FormArray {
    return this.form.get('files') as FormArray;
  }

  get ctrls() {
    return this.form.controls;
  }

  get fileInfoKeys() {
    return Object.keys(this.fileInfo);
  }

  createForm() {
    this.form = this.form || this.fb.group({
      files: this.fb.array([], (ctrl) => {
        return ctrl.value.length > 0 ? null : { required: true };
      }),
      mid: [this.authFormService.memberID, Validators.required],
      playlistName: [this.playlistName],
      playlistUri: [this.playlistUri]
    });
  }

  getFileInputItem({ name = '', caption = '', file = null, resized = null, blob = null, localUrl = null, mimeType = '', size = 0, isValid = true }): FormGroup {
    const fileValue = blob ? blob : file;
    return this.fb.group({
      ...{
        caption: [caption],
        file: [fileValue, Validators.required],
        isValid: [isValid],
        localUrl: [localUrl],
        mid: [this.authFormService.memberID, Validators.required],
        mimeType: [mimeType],
        name: [name, Validators.required],
        playlistUri: [this.playlistUri],
        resized: [resized],
        size: [size]
      },
      ...this.uploadData
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

  updateFormValues() {
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

  appendToQueue(files, callback?) {
    // Reset the button state so more files can be added
    this.showCustomFileInput = false;
    setTimeout(() => {
      this.showCustomFileInput = true;
    });

    (files || []).forEach((file) => {
      const appendFile = (res: any = {}) => {
        if (file.size > 0) {
          const {name: fileName} = file;
          const name = UtilsService.fileNameToTitle(fileName);
          console.log({name, file, resized: res.url, blob: res.blob, mimeType: file.type, size: file.size});
          this.addFileInputItem({name, file, resized: res.url, blob: res.blob, mimeType: file.type, size: file.size});

          if (typeof callback === 'function') {
            callback();
          }
        }
      };

      appendFile();

      if (this.isZipFile(file.type)) {
        UtilsService.loadScript('/assets/static/jszip.min.js', 'jszip', () => {
          let zipContent = [];
          this.window.JSZip.loadAsync(file) // read the Blob
            .then((zip) => {
              let rootDir = '';
              zip.forEach((relativePath, zipEntry) => {
                const fileName = zipEntry.name;
                if (!(/(^|\/)\.[^\/\.]/g).test(fileName)) {
                  const parts = fileName.split('/');
                  if (parts.length === 2 && !parts[1]) {
                    rootDir = fileName;
                  } else if (!zipEntry.dir) {
                    if (/screenshot/gi.test(fileName)) {
                      zip.file(fileName).async('arraybuffer').then((content) => {
                        const type = 'image/png';
                        const blob = new Blob([content], {type});
                        const url = URL.createObjectURL(blob);

                        // show a preview from the buffer file
                        // this.zipContentAction.emit({thumb: url});
                      });
                    }
                    zipContent.push(fileName);
                  }
                }
              });

              zipContent = zipContent.map((f) => {
                return f.replace(rootDir, '');
              });

              // this.zipContentAction.emit({files: zipContent});

            }, (e) => {});
        });
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
    const keys = Object.keys(items.value).reverse();
    this.loading = true;

    if (e) { e.preventDefault(); }

    (async function processFile() {
      const key = keys.shift();
      if (!key) {
        that.done = true;
        that.loading = false;

        that.clearFile();
        that.closeUploadModal();

        Swal.fire('Success!', 'All Done', 'success').then();

        that.loading = false;

        return;
      }

      const rawData = {...items.value[key]};
      const data = that.toFormData(rawData);

      that.loading = true;
      const prog$: any = that.dataRestService.doUpload(data);
      that.subs.add(prog$.subscribe((event: any) => {
        if (event && event.type === HttpEventType.UploadProgress) {
            // This is an upload progress event. Compute and show the % done:
          that.progressInfo[key] = Math.round(
              (100 * event.loaded) / event.total
            );
          console.log(that.progressInfo[key]);
          that.progressObs$.next({key, progress: that.progressInfo[key]});
        } else if (event instanceof HttpResponse) {
          const resp = event.body;

          if (resp.success) {
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
    const files = e.target.files;
    this.appendToQueue(files, () => {
      this.onSubmit(e);
    });
  }

  clearFile() {
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

  onDestroy(): void {
    this.clearFile();
    this.subs.unsubscribe();
  }

  formatFileSize(bytes) {
    return UtilsService.formatFileSize(bytes);
  }
}
