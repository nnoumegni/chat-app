import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DroppableUploadComponent } from './droppable-upload.component';
import {SharedModule} from '../../../shared.module';

@NgModule({
  declarations: [DroppableUploadComponent],
  exports: [DroppableUploadComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule
  ]
})
export class DroppableUploadModule {}
